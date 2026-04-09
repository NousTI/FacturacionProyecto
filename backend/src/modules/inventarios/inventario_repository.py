from typing import List, Optional
from uuid import UUID
from fastapi import Depends
from sqlalchemy import text
from ...config.database import get_db
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
            WHERE i.empresa_id = :empresa_id
            ORDER BY i.created_at DESC
        """
        result = self.db.execute(text(query), {"empresa_id": str(empresa_id)})
        return [dict(row._mapping) for row in result]

    def listar_por_producto(self, producto_id: UUID) -> List[dict]:
        """Listar inventario de un producto específico"""
        query = """
            SELECT *
            FROM sistema_facturacion.inventario
            WHERE producto_id = :producto_id
            ORDER BY created_at DESC
        """
        result = self.db.execute(text(query), {"producto_id": str(producto_id)})
        return [dict(row._mapping) for row in result]

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        """Obtener un registro de inventario por ID"""
        query = """
            SELECT i.*, p.nombre as producto_nombre
            FROM sistema_facturacion.inventario i
            JOIN sistema_facturacion.productos p ON i.producto_id = p.id
            WHERE i.id = :id
        """
        result = self.db.execute(text(query), {"id": str(id)})
        row = result.first()
        return dict(row._mapping) if row else None

    def crear(self, data: dict) -> Optional[dict]:
        """Crear un registro de inventario"""
        query = """
            INSERT INTO sistema_facturacion.inventario (
                empresa_id, producto_id, tipo_movimiento, unidad_medida,
                cantidad, fecha, estado, ubicacion_fisica, observaciones
            ) VALUES (
                :empresa_id, :producto_id, :tipo_movimiento, :unidad_medida,
                :cantidad, :fecha, :estado, :ubicacion_fisica, :observaciones
            )
            RETURNING *
        """
        result = self.db.execute(text(query), data)
        self.db.commit()
        row = result.first()
        return dict(row._mapping) if row else None

    def actualizar(self, id: UUID, data: dict) -> Optional[dict]:
        """Actualizar un registro de inventario"""
        # Build SET clause dynamically
        set_clause = ", ".join([f"{k} = :{k}" for k in data.keys()])
        query = f"""
            UPDATE sistema_facturacion.inventario
            SET {set_clause}, updated_at = NOW()
            WHERE id = :id
            RETURNING *
        """
        data['id'] = str(id)
        result = self.db.execute(text(query), data)
        self.db.commit()
        row = result.first()
        return dict(row._mapping) if row else None

    def eliminar(self, id: UUID) -> bool:
        """Eliminar un registro de inventario"""
        query = "DELETE FROM sistema_facturacion.inventario WHERE id = :id"
        result = self.db.execute(text(query), {"id": str(id)})
        self.db.commit()
        return result.rowcount > 0

    def obtener_stock_por_estado(self, empresa_id: UUID) -> List[dict]:
        """Obtener resumen de stock por estado"""
        query = """
            SELECT
                p.id, p.nombre, p.codigo,
                COALESCE(SUM(CASE WHEN i.estado = 'DISPONIBLE' THEN i.cantidad ELSE 0 END), 0) as disponible,
                COALESCE(SUM(CASE WHEN i.estado = 'RESERVADO' THEN i.cantidad ELSE 0 END), 0) as reservado,
                COALESCE(SUM(CASE WHEN i.estado = 'DAÑADO' THEN i.cantidad ELSE 0 END), 0) as dañado,
                COALESCE(SUM(CASE WHEN i.estado = 'EN_TRANSITO' THEN i.cantidad ELSE 0 END), 0) as en_transito,
                COALESCE(SUM(i.cantidad), 0) as total
            FROM sistema_facturacion.productos p
            LEFT JOIN sistema_facturacion.inventario i ON p.id = i.producto_id AND i.empresa_id = :empresa_id
            WHERE p.empresa_id = :empresa_id AND p.estado = 'ACTIVO'
            GROUP BY p.id, p.nombre, p.codigo
            ORDER BY p.nombre
        """
        result = self.db.execute(text(query), {"empresa_id": str(empresa_id)})
        return [dict(row._mapping) for row in result]
