from fastapi import Depends
from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Optional
from ...database.session import get_db
from ...database.transaction import db_transaction

class AuthRepository:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_sesion(self, user_id: UUID, jti: str, user_agent: str = None, ip_address: str = None) -> str:
        expires_at = datetime.now(timezone.utc) + timedelta(days=1)
        query = """
            INSERT INTO sistema_facturacion.user_sessions (id, user_id, is_valid, expires_at, user_agent, ip_address)
            VALUES (%s, %s, TRUE, %s, %s, %s)
            RETURNING id
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (jti, str(user_id), expires_at, user_agent, ip_address))
            row = cur.fetchone()
            return str(row['id']) if row else None

    def invalidar_sesion(self, sid: str, reason: str = 'LOGOUT'):
        query = """
            UPDATE sistema_facturacion.user_sessions 
            SET is_valid = FALSE, revoked_at = NOW(), revoked_reason = %s 
            WHERE id = %s
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (reason, sid))

    def tiene_sesion_activa(self, user_id: UUID) -> bool:
        query = """
            SELECT 1 FROM sistema_facturacion.user_sessions 
            WHERE user_id = %s AND is_valid = TRUE AND expires_at > NOW()
            LIMIT 1
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(user_id),))
            return cur.fetchone() is not None

    def actualizar_ultimo_acceso(self, user_id: UUID):
        query = "UPDATE sistema_facturacion.users SET ultimo_acceso = NOW() WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(user_id),))

    def obtener_sesion(self, sid: str) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.user_sessions WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (sid,))
            row = cur.fetchone()
            return dict(row) if row else None

    def registrar_log(self, user_id: UUID, evento: str, origen: str = 'SISTEMA', detail: str = None, ip_address: str = None, ua: str = None):
        query = """
            INSERT INTO sistema_facturacion.users_logs (user_id, evento, origen, motivo, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(user_id) if user_id else None, evento, origen, detail, ip_address, ua))
