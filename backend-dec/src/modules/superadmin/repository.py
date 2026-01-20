from fastapi import Depends
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta, timezone
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioSuperadmin:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_superadmin(self, data: dict, password_hash: str) -> Optional[dict]:
        data['password_hash'] = password_hash
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO superadmin ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_email(self, email: str) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM superadmin WHERE email = %s", (email,))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_ultimo_login(self, id: UUID):
        query = "UPDATE superadmin SET last_login = NOW() WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))

    # --- Sesiones ---
    def crear_sesion(self, superadmin_id: UUID, jti: str, user_agent: str = None, ip: str = None):
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=60)
        query = """
            INSERT INTO superadmin_sessions (id, superadmin_id, is_valid, expires_at, user_agent, ip_address)
            VALUES (%s, %s, TRUE, %s, %s, %s)
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (jti, str(superadmin_id), expires_at.replace(tzinfo=None), user_agent, ip))
            return jti

    def invalidar_sesion(self, jti: str):
        query = "UPDATE superadmin_sessions SET is_valid = FALSE WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (jti,))

    def obtener_sesion_activa(self, superadmin_id: UUID):
        query = "SELECT * FROM superadmin_sessions WHERE superadmin_id = %s AND is_valid = TRUE ORDER BY expires_at DESC LIMIT 1"
        with self.db.cursor() as cur:
            cur.execute(query, (str(superadmin_id),))
            return cur.fetchone()
