from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction

class GastoRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def validate_user_empresa(self, usuario_id: UUID, empresa_id: UUID) -> bool:
        if not self.db: return False
        with self.db.cursor() as cur:
            cur.execute("SELECT 1 FROM usuario WHERE id = %s AND empresa_id = %s", (str(usuario_id), str(empresa_id)))
            return cur.fetchone() is not None

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def create(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        
        fields = list(data.keys())
        values = self._serialize_uuids(list(data.values()))
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO gasto ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_by_id(self, id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM gasto WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_by_empresa(self, empresa_id: UUID) -> List[dict]:
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT * FROM gasto 
                WHERE empresa_id = %s 
                ORDER BY fecha_emision DESC, created_at DESC
            """, (str(empresa_id),))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def list_all(self) -> List[dict]:
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT * FROM gasto 
                ORDER BY fecha_emision DESC, created_at DESC
            """)
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update(self, id: UUID, data: dict) -> Optional[dict]:
        if not self.db or not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        values = self._serialize_uuids(list(data.values()))
        values.append(str(id))
        
        query = f"""
            UPDATE gasto
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete(self, id: UUID) -> bool:
        if not self.db: return False
        query = "DELETE FROM gasto WHERE id = %s RETURNING id"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.fetchone() is not None
