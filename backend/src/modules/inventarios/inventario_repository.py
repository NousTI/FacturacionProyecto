from typing import List, Optional
from uuid import UUID
from fastapi import Depends
from ...database.session import get_db
from ...constants.inventario import UNIDADES_MEDIDA, ESTADOS_INVENTARIO


class RepositorioInventarioStock:
    """Repositorio para gestionar la tabla 'inventario' (estado actual de stock)"""

    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_por_empresa(self, empresa_id: UUID) -> List[dict]:
        """Listar todo el inventario de una empresa"""
        query = """
            SELECT
                i.id, i.empresa_id, i.producto_id, i.tipo_movimiento, i.unidad_medida,
                i.cantidad, i.fecha, i.estado, i.ubicacion_fisica, i.observaciones,
                i.created_at, i.updated_at,
                p.nombre as producto_nombre, p.codigo as producto_codigo
            FROM sistema_facturacion.inventario i
            JOIN sistema_facturacion.productos p ON i.producto_id = p.id
            WHERE i.empresa_id = %s
            ORDER BY i.created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]

    def listar_por_producto(self, producto_id: UUID) -> List[dict]:
        """Listar inventario de un producto específico"""
        query = """
            SELECT *
            FROM sistema_facturacion.inventario
            WHERE producto_id = %s
            ORDER BY created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(producto_id),))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        """Obtener un registro de inventario por ID"""
        query = """
            SELECT i.*, p.nombre as producto_nombre
            FROM sistema_facturacion.inventario i
            JOIN sistema_facturacion.productos p ON i.producto_id = p.id
            WHERE i.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear(self, data: dict) -> Optional[dict]:
        """Crear un registro de inventario"""
        query = """
            INSERT INTO sistema_facturacion.inventario (
                empresa_id, producto_id, tipo_movimiento, unidad_medida,
                cantidad, fecha, estado, ubicacion_fisica, observaciones
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING *
        """
        with self.db.cursor() as cur:
            cur.execute(query, (
                str(data.get('empresa_id')),
                str(data.get('producto_id')),
                data.get('tipo_movimiento'),
                data.get('unidad_medida'),
                data.get('cantidad'),
                data.get('fecha'),
                data.get('estado'),
                data.get('ubicacion_fisica'),
                data.get('observaciones')
            ))
            self.db.commit()
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar(self, id: UUID, data: dict) -> Optional[dict]:
        """Actualizar un registro de inventario"""
        set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
        values = list(data.values()) + [str(id)]

        query = f"""
            UPDATE sistema_facturacion.inventario
            SET {set_clause}, updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        with self.db.cursor() as cur:
            cur.execute(query, tuple(values))
            self.db.commit()
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar(self, id: UUID) -> bool:
        """Eliminar un registro de inventario"""
        query = "DELETE FROM sistema_facturacion.inventario WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            self.db.commit()
            return cur.rowcount > 0

    def obtener_stock_por_estado(self, empresa_id: UUID) -> List[dict]:
        """Obtener resumen de stock por estado"""
        query = """
            SELECT
                p.id, p.nombre, p.codigo,
                COALESCE(SUM(CASE WHEN i.estado = 'DISPONIBLE' THEN i.cantidad ELSE 0 END), 0) as disponible,
                COALESCE(SUM(CASE WHEN i.estado = 'RESERVADO' THEN i.cantidad ELSE 0 END), 0) as reservado,
                COALESCE(SUM(CASE WHEN i.estado = 'DAÑADO' THEN i.cantidad ELSE 0 END), 0) as danado,
                COALESCE(SUM(CASE WHEN i.estado = 'EN_TRANSITO' THEN i.cantidad ELSE 0 END), 0) as en_transito,
                COALESCE(SUM(i.cantidad), 0) as total
            FROM sistema_facturacion.productos p
            LEFT JOIN sistema_facturacion.inventario i ON p.id = i.producto_id AND i.empresa_id = %s
            WHERE p.empresa_id = %s AND p.activo = TRUE
            GROUP BY p.id, p.nombre, p.codigo
            ORDER BY p.nombre
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), str(empresa_id)))
            return [dict(row) for row in cur.fetchall()]
