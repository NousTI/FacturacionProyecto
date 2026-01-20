from fastapi import Depends
from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Optional
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioAutenticacion:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_sesion_usuario(self, usuario_id: UUID, jti: str, user_agent: str = None, ip: str = None) -> str:
        expires_at = datetime.now(timezone.utc) + timedelta(days=1)
        query = """
            INSERT INTO usuario_sesiones (id, usuario_id, is_valid, expires_at, user_agent, ip_address)
            VALUES (%s, %s, TRUE, %s, %s, %s)
            RETURNING id
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (jti, str(usuario_id), expires_at.replace(tzinfo=None), user_agent, ip))
            row = cur.fetchone()
            return str(row['id']) if row else None

    def invalidar_sesion_usuario(self, sid: str):
        query = "UPDATE usuario_sesiones SET is_valid = FALSE WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (sid,))

    def obtener_sesion_usuario(self, sid: str) -> Optional[dict]:
        query = "SELECT * FROM usuario_sesiones WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (sid,))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear_sesion_vendedor(self, vendedor_id: UUID, jti: str, user_agent: str = None, ip: str = None) -> str:
        expires_at = datetime.now(timezone.utc) + timedelta(days=1)
        query = """
            INSERT INTO vendedor_sessions (id, vendedor_id, is_valid, expires_at, user_agent, ip_address)
            VALUES (%s, %s, TRUE, %s, %s, %s)
            RETURNING id
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (jti, str(vendedor_id), expires_at.replace(tzinfo=None), user_agent, ip))
            row = cur.fetchone()
            return str(row['id']) if row else None

    def invalidar_sesion_vendedor(self, sid: str):
        query = "UPDATE vendedor_sessions SET is_valid = FALSE WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (sid,))

    def obtener_sesion_vendedor(self, sid: str) -> Optional[dict]:
        query = "SELECT * FROM vendedor_sessions WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (sid,))
            row = cur.fetchone()
            return dict(row) if row else None
