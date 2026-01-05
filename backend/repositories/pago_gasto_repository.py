from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from database.connection import get_db_connection
from database.transaction import db_transaction

class PagoGastoRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def create(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        
        fields = list(data.keys())
        values = self._serialize_uuids(list(data.values()))
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO pago_gasto ({', '.join(fields)})
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
            cur.execute("SELECT * FROM pago_gasto WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_by_gasto(self, gasto_id: UUID) -> List[dict]:
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT * FROM pago_gasto 
                WHERE gasto_id = %s 
                ORDER BY created_at DESC
            """, (str(gasto_id),))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def list_all(self) -> List[dict]:
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT * FROM pago_gasto 
                ORDER BY created_at DESC
            """)
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update(self, id: UUID, data: dict) -> Optional[dict]:
        if not self.db or not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        values = self._serialize_uuids(list(data.values()))
        values.append(str(id))
        
        query = f"""
            UPDATE pago_gasto
            SET {', '.join(set_clauses)}
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete(self, id: UUID) -> bool:
        if not self.db: return False
        query = "DELETE FROM pago_gasto WHERE id = %s RETURNING id"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.fetchone() is not None

    def get_gasto_empresa(self, gasto_id: UUID) -> Optional[UUID]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT empresa_id FROM gasto WHERE id = %s", (str(gasto_id),))
            row = cur.fetchone()
            return row['empresa_id'] if row else None

    def get_total_pagado(self, gasto_id: UUID) -> Decimal:
        if not self.db: return Decimal(0)
        with self.db.cursor() as cur:
            cur.execute("SELECT SUM(monto) as total FROM pago_gasto WHERE gasto_id = %s", (str(gasto_id),))
            row = cur.fetchone()
            return row['total'] if row and row['total'] else Decimal(0)
            
    def get_gasto_total(self, gasto_id: UUID) -> Decimal:
        if not self.db: return Decimal(0)
        with self.db.cursor() as cur:
            cur.execute("SELECT total FROM gasto WHERE id = %s", (str(gasto_id),))
            row = cur.fetchone()
            return row['total'] if row and row['total'] else Decimal(0)

    def update_gasto_estado(self, gasto_id: UUID, estado: str):
         if not self.db: return
         with db_transaction(self.db) as cur:
            cur.execute("UPDATE gasto SET estado_pago = %s WHERE id = %s", (estado, str(gasto_id)))
