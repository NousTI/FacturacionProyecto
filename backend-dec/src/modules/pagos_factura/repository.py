from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioPagosFactura:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_pago(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO pago_factura ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM pago_factura WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_por_cuenta(self, cuenta_cobrar_id: UUID, limit: int = 100, offset: int = 0) -> List[dict]:
        query = "SELECT * FROM pago_factura WHERE cuenta_cobrar_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(cuenta_cobrar_id), limit, offset))
            return [dict(row) for row in cur.fetchall()]

    def listar_todos(self, limit: int = 100, offset: int = 0) -> List[dict]:
        query = "SELECT * FROM pago_factura ORDER BY created_at DESC LIMIT %s OFFSET %s"
        with self.db.cursor() as cur:
            cur.execute(query, (limit, offset))
            return [dict(row) for row in cur.fetchall()]
