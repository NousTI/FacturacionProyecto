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
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar(self, empresa_id: Optional[UUID] = None, activo: Optional[bool] = None) -> List[dict]:
        query = "SELECT * FROM sistema_facturacion.facturacion_programada WHERE 1=1"
        params = []
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
        if activo is not None:
            query += " AND activo = %s"
            params.append(activo)
            
        query += " ORDER BY proxima_emision ASC"
        with self.db.cursor() as cur:
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
        """Obtiene programaciones que deben ejecutarse hoy o en el pasado."""
        query = """
            SELECT * FROM sistema_facturacion.facturacion_programada 
            WHERE activo = TRUE 
            AND (proxima_emision IS NULL OR proxima_emision <= CURRENT_DATE)
            AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]
