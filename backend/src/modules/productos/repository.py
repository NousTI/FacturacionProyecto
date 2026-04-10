from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioProductos:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_productos(self, empresa_id: Optional[UUID] = None, nombre: Optional[str] = None, codigo: Optional[str] = None) -> List[dict]:
        query = "SELECT * FROM sistema_facturacion.productos WHERE activo = TRUE"
        params = []
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))

        if nombre:
            query += " AND nombre ILIKE %s"
            params.append(f"%{nombre}%")
        if codigo:
            query += " AND codigo ILIKE %s"
            params.append(f"%{codigo}%")
            
        query += " ORDER BY created_at DESC"
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_id(self, producto_id: UUID) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.productos WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(producto_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def codigo_existe(self, codigo: str, empresa_id: UUID) -> bool:
        with self.db.cursor() as cur:
            cur.execute(
                "SELECT id FROM sistema_facturacion.productos WHERE codigo = %s AND empresa_id = %s", 
                (codigo, str(empresa_id))
            )
            return cur.fetchone() is not None

    def crear_producto(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.productos ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_producto(self, producto_id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(producto_id))

        query = f"UPDATE sistema_facturacion.productos SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id=%s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_producto(self, producto_id: UUID) -> bool:
        # Soft Delete
        query = "UPDATE sistema_facturacion.productos SET activo = FALSE, updated_at = NOW() WHERE id=%s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(producto_id),))
            return cur.rowcount > 0

    def obtener_productos_mas_vendidos(self, empresa_id: UUID, fecha_inicio: Optional[str], fecha_fin: Optional[str], limit: int, criterio: str) -> List[dict]:
        order_by = "cantidad_vendida DESC" if criterio == 'cantidad' else "total_vendido DESC"
        query = f"""
            SELECT p.id, p.codigo, p.nombre, p.costo, p.unidad_medida,
                   SUM(fd.cantidad) as cantidad_vendida,
                   SUM(fd.cantidad * fd.precio_unitario) as total_vendido,
                   SUM(fd.cantidad * (fd.precio_unitario - COALESCE(p.costo, 0))) as utilidad,
                   CASE 
                       WHEN SUM(fd.cantidad * COALESCE(p.costo, 0)) > 0 
                       THEN ((SUM(fd.cantidad * fd.precio_unitario) - SUM(fd.cantidad * COALESCE(p.costo, 0))) / SUM(fd.cantidad * COALESCE(p.costo, 0))) * 100 
                       ELSE 100 
                   END as margen
            FROM sistema_facturacion.productos p
            JOIN sistema_facturacion.facturas_detalle fd ON p.id = fd.producto_id
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE p.empresa_id = %s AND f.estado != 'ANULADA'
        """
        params = [str(empresa_id)]
        if fecha_inicio:
            query += " AND f.fecha_emision >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND f.fecha_emision <= %s"
            params.append(fecha_fin)
            
        query += f" GROUP BY p.id, p.codigo, p.nombre, p.costo, p.unidad_medida ORDER BY {order_by} LIMIT %s"
        params.append(limit)
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_productos_sin_movimiento(self, empresa_id: UUID, dias: int) -> List[dict]:
        query = """
            SELECT p.id, p.codigo, p.nombre, p.stock_actual, p.costo, p.unidad_medida,
                   MAX(f.fecha_emision) as ultima_venta,
                   (CURRENT_DATE - MAX(f.fecha_emision)::DATE) as dias_sin_movimiento
            FROM sistema_facturacion.productos p
            LEFT JOIN sistema_facturacion.facturas_detalle fd ON p.id = fd.producto_id
            LEFT JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id AND f.estado != 'ANULADA'
            WHERE p.empresa_id = %s AND p.activo = TRUE
            GROUP BY p.id, p.codigo, p.nombre, p.stock_actual, p.costo, p.unidad_medida
            HAVING (MAX(f.fecha_emision) IS NULL) OR ((CURRENT_DATE - MAX(f.fecha_emision)::DATE) >= %s)
            ORDER BY dias_sin_movimiento DESC NULLS FIRST
        """
        params = [str(empresa_id), dias]
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_rentabilidad_productos(self, empresa_id: UUID) -> List[dict]:
        query = """
            SELECT p.id, p.codigo, p.nombre, p.precio, p.costo, p.unidad_medida,
                   (p.precio - COALESCE(p.costo, 0)) as utilidad_unitaria,
                   CASE WHEN COALESCE(p.costo, 0) > 0 THEN ((p.precio - p.costo) / p.costo) * 100 ELSE 100 END as margen,
                   COALESCE(SUM(fd.cantidad), 0) as cantidad_vendida,
                   COALESCE(SUM(fd.cantidad), 0) * (p.precio - COALESCE(p.costo, 0)) as utilidad_total
            FROM sistema_facturacion.productos p
            LEFT JOIN sistema_facturacion.facturas_detalle fd ON p.id = fd.producto_id
            LEFT JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id AND f.estado != 'ANULADA'
            WHERE p.empresa_id = %s AND p.activo = TRUE
            GROUP BY p.id, p.codigo, p.nombre, p.precio, p.costo, p.unidad_medida
            ORDER BY margen DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]

    def obtener_reporte_inventario(self, empresa_id: UUID) -> List[dict]:
        query = """
            SELECT p.id, p.codigo, p.nombre, p.stock_actual, p.stock_minimo, p.costo as costo_unitario, p.unidad_medida,
                   (p.stock_actual * COALESCE(p.costo, 0)) as valor_total_inventario,
                   CASE 
                       WHEN p.stock_actual <= 0 THEN 'CRITICO'
                       WHEN p.stock_actual <= p.stock_minimo THEN 'BAJO'
                       ELSE 'OK'
                   END as estado_alerta
            FROM sistema_facturacion.productos p
            WHERE p.empresa_id = %s AND p.maneja_inventario = TRUE AND p.activo = TRUE
            ORDER BY estado_alerta, p.stock_actual ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]

    def obtener_kardex_producto(self, producto_id: UUID, empresa_id: UUID, fecha_inicio: Optional[str], fecha_fin: Optional[str]) -> List[dict]:
        query = """
            SELECT fecha_movimiento as fecha, tipo_movimiento as tipo, documento_referencia as documento,
                   CASE WHEN tipo_movimiento IN ('entrada', 'ajuste', 'devolucion') THEN cantidad ELSE 0 END as entrada,
                   CASE WHEN tipo_movimiento IN ('salida') THEN cantidad ELSE 0 END as salida,
                   stock_nuevo as saldo, costo_unitario, costo_total
            FROM sistema_facturacion.movimiento_inventario
            WHERE producto_id = %s
        """
        params = [str(producto_id)]
        if fecha_inicio:
             query += " AND fecha_movimiento >= %s"
             params.append(fecha_inicio)
        if fecha_fin:
             query += " AND fecha_movimiento <= %s"
             params.append(fecha_fin)
             
        query += " ORDER BY fecha_movimiento ASC"
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]
