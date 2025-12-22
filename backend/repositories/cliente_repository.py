from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction

class ClienteRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        """Helper to convert UUIDs to strings for database compatibility."""
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def create_cliente(self, cliente_data: dict) -> Optional[dict]:
        if not self.db: return None
        
        fields = list(cliente_data.keys())
        # Provide explicit cleaning of values
        clean_values = self._serialize_uuids(list(cliente_data.values()))
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO cliente ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_cliente(self, cliente_id: UUID) -> Optional[dict]:
        return self.get_cliente_by_id(cliente_id)

    def get_cliente_by_id(self, cliente_id: UUID) -> Optional[dict]:
        if not self.db: return None
        
        query = "SELECT * FROM cliente WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(cliente_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_clientes(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        if not self.db: return []
        
        query = "SELECT * FROM cliente"
        params = []
        
        if empresa_id:
            query += " WHERE empresa_id = %s"
            params.append(str(empresa_id))
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update_cliente(self, cliente_id: UUID, cliente_data: dict) -> Optional[dict]:
        if not self.db or not cliente_data: return None
        
        set_clauses = [f"{key} = %s" for key in cliente_data.keys()]
        clean_values = self._serialize_uuids(list(cliente_data.values()))
        
        # Append ID for the WHERE clause
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

    def delete_cliente(self, cliente_id: UUID) -> bool:
        # Removed broad try/except to allow proper error propagation to updates/services
        query = "DELETE FROM cliente WHERE id = %s RETURNING id"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(cliente_id),))
            return cur.fetchone() is not None
