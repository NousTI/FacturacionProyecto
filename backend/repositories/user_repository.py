from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction

class UserRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        """Helper to convert UUIDs to strings for database compatibility."""
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def create_user(self, user_data: dict) -> Optional[dict]:
        if not self.db: return None
        
        fields = list(user_data.keys())
        clean_values = self._serialize_uuids(list(user_data.values()))
        placeholders = ["%s"] * len(fields)

        query = f"""
            INSERT INTO usuario ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_user_by_email(self, email: str) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM usuario WHERE email=%s", (email,))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_user_by_id(self, user_id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM usuario WHERE id=%s", (str(user_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_users(self, empresa_id: Optional[UUID] = None, rol_id: Optional[UUID] = None) -> List[dict]:
        if not self.db: return []
        query = "SELECT * FROM usuario WHERE 1=1"
        params = []
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
            
        if rol_id:
            query += " AND rol_id = %s"
            params.append(str(rol_id))
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update_user(self, user_id: UUID, user_data: dict) -> Optional[dict]:
        if not self.db or not user_data: return None
        
        set_clauses = [f"{key} = %s" for key in user_data.keys()]
        clean_values = self._serialize_uuids(list(user_data.values()))
        
        # Also ensure user_id is string
        clean_values.append(str(user_id))
        
        query = f"""
            UPDATE usuario 
            SET {', '.join(set_clauses)}, updated_at = NOW() 
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete_user(self, user_id: UUID) -> bool:
        # Removed broad try/except to allow error propagation
        query = "DELETE FROM usuario WHERE id = %s RETURNING id"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(user_id),))
            return cur.fetchone() is not None
