from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID

class UserRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create_user(self, user_data: dict):
        if not self.db: return None
        
        fields = list(user_data.keys())
        values = list(user_data.values())
        placeholders = ["%s"] * len(fields)

        # Prepare values converting UUIDs to strings for psycopg2
        clean_values = []
        for v in values:
            if isinstance(v, UUID):
                clean_values.append(str(v))
            else:
                clean_values.append(v)
        
        query = f"""
            INSERT INTO usuario ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        # Remove broad try/except to verify the actual error (likely FK violation)
        # and checking RETURNING *
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_user_by_email(self, email: str):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM usuario WHERE email=%s", (email,))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_user_by_id(self, user_id: UUID):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM usuario WHERE id=%s", (str(user_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_users(self, empresa_id: UUID = None, rol_id: UUID = None):
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

    def update_user(self, user_id: UUID, user_data: dict):
        if not self.db or not user_data: return None
        
        set_clauses = [f"{key} = %s" for key in user_data.keys()]
        values = list(user_data.values())
        # Prepare values converting UUIDs to strings for psycopg2
        clean_values = []
        for v in values:
            if isinstance(v, UUID):
                clean_values.append(str(v))
            else:
                clean_values.append(v)
        
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

    def delete_user(self, user_id: UUID):
        # Hard delete as per standard request, or soft? 
        # User requested "eliminar", implies DB removal generally for this project so far (like Empresa).
        query = "DELETE FROM usuario WHERE id = %s RETURNING id"
        try:
            with db_transaction(self.db) as cur:
                cur.execute(query, (str(user_id),))
                return cur.fetchone() is not None
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
