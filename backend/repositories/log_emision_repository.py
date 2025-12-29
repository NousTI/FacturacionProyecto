from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction

class LogEmisionRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def create(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        
        fields = list(data.keys())
        clean_values = self._serialize_uuids(list(data.values()))
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO log_emision ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def list(self, limit: int = 100, offset: int = 0) -> List[dict]:
        if not self.db: return []
        
        query = "SELECT * FROM log_emision ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params = [limit, offset]
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]
            
    def get_by_factura_id(self, factura_id: UUID) -> List[dict]:
        if not self.db: return []
        query = "SELECT * FROM log_emision WHERE factura_id = %s ORDER BY created_at DESC"
        with self.db.cursor() as cur:
            cur.execute(query, (str(factura_id),))
            rows = cur.fetchall()
            return [dict(row) for row in rows]
