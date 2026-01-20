import json
from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioVendedores:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear(self, data: dict, password_hash: str) -> Optional[dict]:
        data['password_hash'] = password_hash
        if data.get('configuracion'): data['configuracion'] = json.dumps(data['configuracion'])
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO vendedor ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM vendedor WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_email(self, email: str) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM vendedor WHERE email = %s", (email,))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_todos(self) -> List[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM vendedor ORDER BY created_at DESC")
            return [dict(row) for row in cur.fetchall()]

    def actualizar(self, id: UUID, data: dict) -> Optional[dict]:
        if data.get('configuracion'): data['configuracion'] = json.dumps(data['configuracion'])
        set_clauses = [f"{k} = %s" for k in data.keys()]
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        values.append(str(id))
        query = f"UPDATE vendedor SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar(self, id: UUID) -> bool:
        query = "DELETE FROM vendedor WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
