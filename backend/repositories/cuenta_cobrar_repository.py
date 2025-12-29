from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction

class CuentaCobrarRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def create(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        
        fields = list(data.keys())
        # Convert UUIDs to strings
        clean_values = self._serialize_uuids(list(data.values()))
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO cuenta_cobrar ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_by_id(self, id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM cuenta_cobrar WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list(self, empresa_id: Optional[UUID] = None, cliente_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        if not self.db: return []
        
        query = "SELECT * FROM cuenta_cobrar"
        params = []
        conditions = []
        
        if empresa_id:
            conditions.append("empresa_id = %s")
            params.append(str(empresa_id))
            
        if cliente_id:
            conditions.append("cliente_id = %s")
            params.append(str(cliente_id))
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update(self, id: UUID, data: dict) -> Optional[dict]:
        if not self.db: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = self._serialize_uuids(list(data.values()))
        clean_values.append(str(id))
        
        query = f"""
            UPDATE cuenta_cobrar
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete(self, id: UUID) -> bool:
        if not self.db: return False
        
        query = "DELETE FROM cuenta_cobrar WHERE id = %s"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
