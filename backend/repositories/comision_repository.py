from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from typing import List, Optional

class ComisionRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def list_comisiones(self, vendedor_id: UUID = None):
        if not self.db: return []
        
        query = "SELECT * FROM comision"
        params = []
        
        if vendedor_id:
            query += " WHERE vendedor_id = %s"
            params.append(str(vendedor_id))
            
        # Optional: Order by date
        query += " ORDER BY fecha_generacion DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def get_by_id(self, comision_id: UUID):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM comision WHERE id = %s", (str(comision_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    # Update (Admin only usually)
    def update(self, comision_id: UUID, update_data: dict):
        if not self.db or not update_data: return None
        
        set_clauses = [f"{key} = %s" for key in update_data.keys()]
        values = list(update_data.values())
        values.append(str(comision_id))
        
        query = f"""
            UPDATE comision
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        
        try:
             with db_transaction(self.db) as cur:
                cur.execute(query, tuple(values))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            print(f"Error updating comision: {e}")
            raise e

    def delete(self, comision_id: UUID):
        try:
            with db_transaction(self.db) as cur:
                cur.execute("DELETE FROM comision WHERE id = %s RETURNING id", (str(comision_id),))
                return cur.fetchone() is not None
        except Exception as e:
            print(f"Error deleting comision: {e}")
            return False
            
    # Note: Create is handled via auto-generation in Suscripcion logic, 
    # but we can add a manual create here if needed (Admin override).
    def create(self, comision_data: dict):
        if not self.db: return None
        fields = list(comision_data.keys())
        values = list(comision_data.values())
        placeholders = ["%s"] * len(fields)
        
        clean_values = []
        for v in values:
            if isinstance(v, UUID):
                clean_values.append(str(v))
            else:
                clean_values.append(v)
        
        query = f"""
            INSERT INTO comision ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None
