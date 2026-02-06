"""
Repositorio de Facturas.

Maneja las consultas SQL para facturas incluyendo:
- Campos JSONB para snapshots
- Filtros avanzados (estado, fechas, usuario)
- Paginación
"""

import json
from fastapi import Depends
from typing import List, Optional, Any
from uuid import UUID
from datetime import date
from psycopg2.extras import Json

from ...database.session import get_db
from ...database.transaction import db_transaction
from .schemas import FacturaListadoFiltros


class RepositorioFacturas:
    """Repositorio para operaciones CRUD de facturas."""
    
    # Campos JSONB que requieren conversión
    JSONB_FIELDS = {
        'snapshot_empresa',
        'snapshot_cliente', 
        'snapshot_establecimiento',
        'snapshot_punto_emision',
        'snapshot_usuario'
    }
    
    def __init__(self, db=Depends(get_db)):
        self.db = db
    
    def _prepare_value(self, key: str, value: Any) -> Any:
        """
        Prepara un valor para inserción en BD.
        Convierte UUIDs a string y dicts a Json para campos JSONB.
        """
        if isinstance(value, UUID):
            return str(value)
        if key in self.JSONB_FIELDS and isinstance(value, dict):
            return Json(value)
        return value
    
    def _prepare_data(self, data: dict) -> dict:
        """Prepara todos los valores del dict para inserción."""
        return {k: self._prepare_value(k, v) for k, v in data.items()}

    def crear_factura(self, data: dict) -> Optional[dict]:
        """
        Crea una nueva factura con snapshots JSONB.
        
        Args:
            data: Dict con los campos de la factura incluyendo snapshots
            
        Returns:
            Dict con la factura creada o None si falla
        """
        prepared = self._prepare_data(data)
        fields = list(prepared.keys())
        values = list(prepared.values())
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.facturas ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        """
        Obtiene una factura por ID incluyendo snapshots.
        
        PostgreSQL automáticamente deserializa JSONB a dict.
        """
        query = "SELECT * FROM sistema_facturacion.facturas WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_facturas(
        self,
        empresa_id: Optional[UUID] = None,
        usuario_id: Optional[UUID] = None,
        filtros: Optional[FacturaListadoFiltros] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[dict]:
        """
        Lista facturas con filtros opcionales.
        
        Args:
            empresa_id: Filtrar por empresa
            usuario_id: Filtrar por usuario (para solo_propias)
            filtros: Filtros adicionales (estado, fechas, etc.)
            limit: Máximo de resultados
            offset: Offset para paginación
            
        Returns:
            Lista de facturas
        """
        query = "SELECT * FROM sistema_facturacion.facturas WHERE 1=1"
        params = []
        
        # Filtro por empresa
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
        
        # Filtro por usuario (solo_propias)
        if usuario_id:
            query += " AND usuario_id = %s"
            params.append(str(usuario_id))
        
        # Filtros adicionales
        if filtros:
            if filtros.estado:
                query += " AND estado = %s"
                params.append(filtros.estado)
            
            if filtros.estado_pago:
                query += " AND estado_pago = %s"
                params.append(filtros.estado_pago)
            
            if filtros.fecha_desde:
                query += " AND fecha_emision >= %s"
                params.append(filtros.fecha_desde)
            
            if filtros.fecha_hasta:
                query += " AND fecha_emision <= %s"
                params.append(filtros.fecha_hasta)
            
            if filtros.cliente_id:
                query += " AND cliente_id = %s"
                params.append(str(filtros.cliente_id))
            
            if filtros.establecimiento_id:
                query += " AND establecimiento_id = %s"
                params.append(str(filtros.establecimiento_id))
            
            if filtros.punto_emision_id:
                query += " AND punto_emision_id = %s"
                params.append(str(filtros.punto_emision_id))
        
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def actualizar_factura(self, id: UUID, data: dict) -> Optional[dict]:
        """
        Actualiza una factura.
        
        NOTA: Los snapshots NO deben actualizarse (son inmutables).
        """
        if not data:
            return None
        
        # Excluir snapshots de actualizaciones
        data_to_update = {
            k: v for k, v in data.items() 
            if k not in self.JSONB_FIELDS
        }
        
        if not data_to_update:
            return self.obtener_por_id(id)
        
        prepared = self._prepare_data(data_to_update)
        set_clauses = [f"{key} = %s" for key in prepared.keys()]
        values = list(prepared.values())
        values.append(str(id))

        query = f"""
            UPDATE sistema_facturacion.facturas 
            SET {', '.join(set_clauses)}, updated_at = NOW() 
            WHERE id = %s 
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None
            
    def eliminar_factura(self, id: UUID) -> bool:
        """Elimina una factura (solo BORRADOR según validación del service)."""
        query = "DELETE FROM sistema_facturacion.facturas WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def contar_facturas(
        self,
        empresa_id: Optional[UUID] = None,
        estado: Optional[str] = None
    ) -> int:
        """Cuenta facturas para estadísticas."""
        query = "SELECT COUNT(*) FROM sistema_facturacion.facturas WHERE 1=1"
        params = []
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
        
        if estado:
            query += " AND estado = %s"
            params.append(estado)
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return cur.fetchone()[0]

    # =========================================================
    # DETALLES DE FACTURA
    # =========================================================
    
    def crear_detalle(self, data: dict) -> Optional[dict]:
        """Crea un detalle de factura."""
        prepared = self._prepare_data(data)
        fields = list(prepared.keys())
        values = list(prepared.values())
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.factura_detalles ({', '.join(fields)}) 
            VALUES ({', '.join(placeholders)}) 
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_detalles(self, factura_id: UUID) -> List[dict]:
        """Lista los detalles de una factura."""
        query = "SELECT * FROM sistema_facturacion.factura_detalles WHERE factura_id = %s ORDER BY created_at"
        with self.db.cursor() as cur:
            cur.execute(query, (str(factura_id),))
            return [dict(row) for row in cur.fetchall()]

    def obtener_detalle(self, id: UUID) -> Optional[dict]:
        """Obtiene un detalle por ID."""
        query = "SELECT * FROM sistema_facturacion.factura_detalles WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_detalle(self, id: UUID, data: dict) -> Optional[dict]:
        """Actualiza un detalle de factura."""
        if not data:
            return None
        
        prepared = self._prepare_data(data)
        set_clauses = [f"{k} = %s" for k in prepared.keys()]
        values = list(prepared.values())
        values.append(str(id))
        
        query = f"""
            UPDATE sistema_facturacion.factura_detalles 
            SET {', '.join(set_clauses)} 
            WHERE id = %s 
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_detalle(self, id: UUID) -> bool:
        """Elimina un detalle de factura."""
        query = "DELETE FROM sistema_facturacion.factura_detalles WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
