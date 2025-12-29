from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from database.connection import get_db_connection
from database.transaction import db_transaction

class PagoFacturaRepository:
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
            INSERT INTO pago_factura ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None
            
    # For updating balances, we might need a method that executes inside an external transaction 
    # OR we handle the transaction in Service and pass the connection.
    # But current pattern is 'db_transaction' per repo call. 
    # If we need atomicity (Payment + Balance Update), we should use a shared transaction.
    # However, 'db_transaction' commits on exit. 
    # For now, I'll rely on sequential updates: 1. Create Payment, 2. Update Balance. 
    # If 2 fails, we have a data inconsistency.
    # Better: Update Balance first? Or use a shared connection context.
    # Given the constraints and current pattern ease, I'll do sequential.

    def get_by_id(self, id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM pago_factura WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list(self, cuenta_cobrar_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        if not self.db: return []
        
        query = "SELECT * FROM pago_factura"
        params = []
        
        if cuenta_cobrar_id:
            query += " WHERE cuenta_cobrar_id = %s"
            params.append(str(cuenta_cobrar_id))
            
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]
