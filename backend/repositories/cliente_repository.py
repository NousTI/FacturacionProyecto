from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID

class ClienteRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create_cliente(self, cliente_data: dict):
        if not self.db: return None
        
        fields = list(cliente_data.keys())
        values = list(cliente_data.values())
        placeholders = ["%s"] * len(fields)
        
        # Serialize UUIDs
        clean_values = []
        for v in values:
            if isinstance(v, UUID):
                clean_values.append(str(v))
            else:
                clean_values.append(v)

        query = f"""
            INSERT INTO cliente ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_cliente(self, cliente_id: UUID):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM cliente WHERE id = %s", (str(cliente_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_clientes(self, empresa_id: UUID):
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM cliente WHERE empresa_id = %s", (str(empresa_id),))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update_cliente(self, cliente_id: UUID, cliente_data: dict):
        if not self.db or not cliente_data: return None
        
        set_clauses = [f"{key} = %s" for key in cliente_data.keys()]
        values = list(cliente_data.values())
        
        # Serialize UUIDs
        clean_values = []
        for v in values:
            if isinstance(v, UUID):
                clean_values.append(str(v))
            else:
                clean_values.append(v)
        
        clean_values.append(str(cliente_id))

        query = f"""
            UPDATE cliente
            SET {', '.join(set_clauses)}
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete_cliente(self, cliente_id: UUID):
        query = "DELETE FROM cliente WHERE id = %s RETURNING id"
        try:
            with db_transaction(self.db) as cur:
                cur.execute(query, (str(cliente_id),))
                return cur.fetchone() is not None
        except Exception:
            return False
