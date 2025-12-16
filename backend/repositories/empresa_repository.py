from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID

class EmpresaRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create_empresa(self, empresa_data: dict):
        if not self.db: return None
        fields = list(empresa_data.keys())
        values = list(empresa_data.values())
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO empresa ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        try:
            with db_transaction(self.db) as cur:
                cur.execute(query, tuple(values))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            print(f"Error creating empresa: {e}")
            return None

    def get_empresa_by_id(self, empresa_id: UUID):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM empresa WHERE id=%s", (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_empresa_by_ruc(self, ruc: str):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM empresa WHERE ruc=%s", (ruc,))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_empresas(self, vendedor_id: UUID = None):
        if not self.db: return []
        query = "SELECT * FROM empresa"
        params = []
        
        if vendedor_id:
            query += " WHERE vendedor_id = %s"
            params.append(str(vendedor_id))
            
        query += " ORDER BY fecha_registro DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update_empresa(self, empresa_id: UUID, empresa_data: dict):
        if not self.db or not empresa_data: return None
        
        set_clauses = [f"{key} = %s" for key in empresa_data.keys()]
        values = list(empresa_data.values())
        values.append(str(empresa_id))
        
        query = f"""
            UPDATE empresa 
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
            print(f"Error updating empresa: {e}")
            return None

    def delete_empresa(self, empresa_id: UUID):
        # Hard delete
        query = "DELETE FROM empresa WHERE id = %s RETURNING id"
        try:
            with db_transaction(self.db) as cur:
                cur.execute(query, (str(empresa_id),))
                return cur.fetchone() is not None
        except Exception as e:
            print(f"Error deleting empresa: {e}")
            return False
