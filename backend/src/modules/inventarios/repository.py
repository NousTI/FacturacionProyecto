from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioInventarios:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_movimiento(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO sistema_facturacion.movimiento_inventario ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_producto(self, producto_id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM sistema_facturacion.productos WHERE id = %s", (str(producto_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_stock(self, producto_id: UUID, nuevo_stock: int):
        query = "UPDATE sistema_facturacion.productos SET stock_actual = %s WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (nuevo_stock, str(producto_id)))

    def listar_por_producto(self, producto_id: UUID) -> List[dict]:
        query = "SELECT * FROM sistema_facturacion.movimiento_inventario WHERE producto_id = %s ORDER BY fecha_movimiento DESC"
        with self.db.cursor() as cur:
            cur.execute(query, (str(producto_id),))
            return [dict(row) for row in cur.fetchall()]

    def listar_todos(self) -> List[dict]:
        query = "SELECT * FROM sistema_facturacion.movimiento_inventario ORDER BY fecha_movimiento DESC"
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def listar_por_empresa(self, empresa_id: UUID, producto_id: Optional[UUID] = None, tipo: Optional[str] = None, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        query = """
            SELECT m.*, p.nombre as producto_nombre, u.nombres || ' ' || u.apellidos as usuario_nombre
            FROM sistema_facturacion.movimiento_inventario m
            JOIN sistema_facturacion.productos p ON m.producto_id = p.id
            JOIN sistema_facturacion.usuarios u ON m.usuario_id = u.id
            WHERE m.empresa_id = %s
        """
        params = [str(empresa_id)]

        if producto_id:
            query += " AND m.producto_id = %s"
            params.append(str(producto_id))
        if tipo:
            query += " AND m.tipo_movimiento = %s"
            params.append(tipo)
        if fecha_inicio:
            query += " AND m.fecha_movimiento >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND m.fecha_movimiento <= %s"
            params.append(fecha_fin)

        query += " ORDER BY m.fecha_movimiento DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_stats(self, empresa_id: UUID) -> dict:
        queries = {
            "total_valor": "SELECT COALESCE(SUM(stock_actual * costo), 0) FROM sistema_facturacion.productos WHERE empresa_id = %s AND activo = TRUE",
            "movimientos_30d": "SELECT COUNT(*) FROM sistema_facturacion.movimiento_inventario WHERE empresa_id = %s AND fecha_movimiento >= CURRENT_DATE - INTERVAL '30 days'",
            "stock_bajo": "SELECT COUNT(*) FROM sistema_facturacion.productos WHERE empresa_id = %s AND maneja_inventario = TRUE AND stock_actual <= stock_minimo AND activo = TRUE"
        }
        
        stats = {}
        with self.db.cursor() as cur:
            cur.execute(queries["total_valor"], (str(empresa_id),))
            row = cur.fetchone()
            stats["total_valor_inventario"] = list(row.values())[0] if row else 0
            
            cur.execute(queries["movimientos_30d"], (str(empresa_id),))
            row = cur.fetchone()
            stats["movimientos_30d"] = list(row.values())[0] if row else 0
            
            cur.execute(queries["stock_bajo"], (str(empresa_id),))
            row = cur.fetchone()
            stats["productos_stock_bajo"] = list(row.values())[0] if row else 0
            
        return stats

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.movimiento_inventario WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_movimiento(self, id: UUID, data: dict) -> Optional[dict]:
        if not data:
            return None

        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(id))

        query = f"UPDATE sistema_facturacion.movimiento_inventario SET {', '.join(set_clauses)} WHERE id = %s RETURNING *"

        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_movimiento(self, id: UUID) -> bool:
        query = "DELETE FROM sistema_facturacion.movimiento_inventario WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
