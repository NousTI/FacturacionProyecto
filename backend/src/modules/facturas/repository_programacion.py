import json
from fastapi import Depends
from typing import List, Optional, Any
from uuid import UUID
from datetime import date
from psycopg2.extras import Json

from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioProgramacion:
    """Repositorio para facturación programada (recurrente)."""
    
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def _prepare_data(self, data: dict) -> dict:
        prepared = {}
        for k, v in data.items():
            if isinstance(v, UUID):
                prepared[k] = str(v)
            elif isinstance(v, dict):
                prepared[k] = Json(v)
            else:
                prepared[k] = v
        return prepared

    def crear(self, data: dict) -> Optional[dict]:
        prepared = self._prepare_data(data)
        fields = list(prepared.keys())
        values = list(prepared.values())
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.facturacion_programada ({', '.join(fields)}) 
            VALUES ({', '.join(placeholders)}) 
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.facturacion_programada WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar(self, empresa_id: Optional[UUID] = None, activo: Optional[bool] = None, usuario_id: Optional[UUID] = None) -> List[dict]:
        query = """
            SELECT fp.*, c.razon_social as cliente_nombre 
            FROM sistema_facturacion.facturacion_programada fp
            JOIN sistema_facturacion.clientes c ON fp.cliente_id = c.id
            WHERE 1=1
        """
        params = []
        if empresa_id:
            query += " AND fp.empresa_id = %s"
            params.append(str(empresa_id))
        if activo is not None:
            query += " AND fp.activo = %s"
            params.append(activo)
        if usuario_id:
            query += " AND fp.usuario_id = %s"
            params.append(str(usuario_id))
            
        query += " ORDER BY fp.proxima_emision ASC"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def actualizar(self, id: UUID, data: dict) -> Optional[dict]:
        if not data:
            return None
        prepared = self._prepare_data(data)
        set_clauses = [f"{k} = %s" for k in prepared.keys()]
        values = list(prepared.values())
        values.append(str(id))
        
        query = f"""
            UPDATE sistema_facturacion.facturacion_programada 
            SET {', '.join(set_clauses)}, updated_at = NOW() 
            WHERE id = %s 
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar(self, id: UUID) -> bool:
        query = "DELETE FROM sistema_facturacion.facturacion_programada WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def obtener_pendientes_emision(self) -> List[dict]:
        """Obtiene programaciones que deben ejecutarse hoy o en el pasado, con info de cliente."""
        query = """
            SELECT fp.*, c.razon_social as cliente_nombre 
            FROM sistema_facturacion.facturacion_programada fp
            JOIN sistema_facturacion.clientes c ON fp.cliente_id = c.id
            WHERE fp.activo = TRUE 
            AND (fp.proxima_emision IS NULL OR fp.proxima_emision <= CURRENT_DATE)
            AND (fp.fecha_fin IS NULL OR fp.fecha_fin >= CURRENT_DATE)
        """
        with db_transaction(self.db) as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]
    def obtener_historial_ejecucion(self, id: UUID, limit: int = 50, offset: int = 0) -> List[dict]:
        """Obtiene el historial técnico de la tabla de logs para una programación."""
        query = """
            SELECT
                l.timestamp as fecha,
                l.estado,
                l.factura_id as factura_id,
                f.numero_factura,
                l.observaciones as detalle,
                l.mensajes as sri_mensajes
            FROM sistema_facturacion.log_emision_facturas l
            LEFT JOIN sistema_facturacion.facturas f ON l.factura_id = f.id
            WHERE l.facturacion_programada_id = %s
            ORDER BY l.timestamp DESC
            LIMIT %s OFFSET %s
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id), limit, offset))
            return [dict(row) for row in cur.fetchall()]
