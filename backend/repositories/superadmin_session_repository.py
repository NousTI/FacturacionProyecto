from datetime import datetime, timedelta, timezone
from database.transaction import db_transaction

class SuperadminSessionRepository:
    def __init__(self, db):
        self.db = db

    def create_session(self, superadmin_id, jti, user_agent=None, ip_address=None, duration_minutes=60):
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)
        with db_transaction(self.db) as cur:
            cur.execute(
                """
                INSERT INTO superadmin_sessions (id, superadmin_id, is_valid, expires_at, user_agent, ip_address)
                VALUES (%s, %s, TRUE, %s, %s, %s)
                """,
                (jti, superadmin_id, expires_at, user_agent, ip_address),
            )
        return jti

    def invalidate_session(self, jti: str):
        with db_transaction(self.db) as cur:
            cur.execute(
                """
                UPDATE superadmin_sessions
                SET is_valid = FALSE
                WHERE id = %s
                """,
                (jti,),
            )

    def get_session(self, jti: str):
        with self.db.cursor() as cur:
            cur.execute(
                """
                SELECT id, superadmin_id, is_valid, expires_at
                FROM superadmin_sessions
                WHERE id = %s
                """,
                (jti,),
            )
            return cur.fetchone()

    def get_active_session_for_superadmin(self, superadmin_id):
        with self.db.cursor() as cur:
            cur.execute(
                """
                SELECT id, is_valid, expires_at
                FROM superadmin_sessions
                WHERE superadmin_id = %s AND is_valid = TRUE
                ORDER BY expires_at DESC
                LIMIT 1
                """,
                (superadmin_id,),
            )
            return cur.fetchone()
