from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioLogs:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_log(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO log_emision ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_logs(self, limite: int = 100, desplazar: int = 0) -> List[dict]:
        query = "SELECT * FROM log_emision ORDER BY created_at DESC LIMIT %s OFFSET %s"
        with self.db.cursor() as cur:
            cur.execute(query, (limite, desplazar))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_factura(self, factura_id: UUID) -> List[dict]:
        query = "SELECT * FROM log_emision WHERE factura_id = %s ORDER BY created_at DESC"
        with self.db.cursor() as cur:
            cur.execute(query, (str(factura_id),))
            return [dict(row) for row in cur.fetchall()]
