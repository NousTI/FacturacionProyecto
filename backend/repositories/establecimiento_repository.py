from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from models.Establecimiento import EstablecimientoCreate, EstablecimientoUpdate
from typing import List, Optional

class EstablecimientoRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create(self, data: EstablecimientoCreate, empresa_id: UUID) -> Optional[dict]:
        query = """
            INSERT INTO establecimiento (
                empresa_id, codigo, nombre, direccion, activo
            ) VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """
        values = (
            str(empresa_id),
            data.codigo,
            data.nombre,
            data.direccion,
            data.activo
        )
        
        with db_transaction(self.db) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            return dict(row) if row else None

    def get_by_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM establecimiento WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list(self, empresa_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        query = "SELECT * FROM establecimiento"
        params = []
        
        if empresa_id:
            query += " WHERE empresa_id = %s"
            params.append(str(empresa_id))
            
        query += " ORDER BY codigo ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update(self, id: UUID, data: EstablecimientoUpdate) -> Optional[dict]:
        # Helper to construct UPDATE query dynamically
        data_dict = data.model_dump(exclude_unset=True)
        if not data_dict:
            return self.get_by_id(id)

        fields = [f"{k} = %s" for k in data_dict.keys()]
        values = list(data_dict.values())
        values.append(str(id))

        fields.append("updated_at = NOW()")

        query = f"UPDATE establecimiento SET {', '.join(fields)} WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete(self, id: UUID) -> bool:
        query = "DELETE FROM establecimiento WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
