from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioPagosGasto:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_pago(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
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

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM pago_gasto WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_por_gasto(self, gasto_id: UUID) -> List[dict]:
        query = "SELECT * FROM pago_gasto WHERE gasto_id = %s ORDER BY created_at DESC"
        with self.db.cursor() as cur:
            cur.execute(query, (str(gasto_id),))
            return [dict(row) for row in cur.fetchall()]

    def listar_todos(self) -> List[dict]:
        query = "SELECT * FROM pago_gasto ORDER BY created_at DESC"
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def actualizar_pago(self, id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(id))

        query = f"UPDATE pago_gasto SET {', '.join(set_clauses)} WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_pago(self, id: UUID) -> bool:
        query = "DELETE FROM pago_gasto WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def obtener_total_pagado(self, gasto_id: UUID) -> Decimal:
        query = "SELECT SUM(monto) as total FROM pago_gasto WHERE gasto_id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(gasto_id),))
            row = cur.fetchone()
            return Decimal(str(row['total'])) if row and row['total'] else Decimal('0.00')
