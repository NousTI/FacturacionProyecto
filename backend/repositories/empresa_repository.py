from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction

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
            RETURNING id, ruc, razon_social, fecha_registro
        """
        
        try:
            with db_transaction(self.db) as cur:
                cur.execute(query, tuple(values))
                return cur.fetchone()
        except Exception as e:
            print(f"Error creating empresa: {e}")
            return None

    def get_empresa_by_id(self, empresa_id):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM empresa WHERE id=%s", (empresa_id,))
            return cur.fetchone()

    def list_empresas(self):
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM empresa ORDER BY fecha_registro DESC")
            return cur.fetchall()
