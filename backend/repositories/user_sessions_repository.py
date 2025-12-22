# backend/repositories/user_sessions_repository.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from database.transaction import db_transaction

def create_session(conn, user_id, jti: str, user_agent: Optional[str] = None, ip_address: Optional[str] = None, duration_minutes: int = 60) -> str:
    """
    Crea una nueva sesión en la base de datos.
    """
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)).replace(tzinfo=None)

    # Use parameterized query securely
    query = """
        INSERT INTO usuario_sesiones (id, usuario_id, is_valid, expires_at, user_agent, ip_address)
        VALUES (%s, %s, TRUE, %s, %s, %s)
    """
    
    with db_transaction(conn) as cur:
        cur.execute(query, (jti, str(user_id), expires_at, user_agent, ip_address))

    return jti


def invalidate_session(conn, jti: str):
    """
    Marca una sesión como inválida (logout).
    """
    query = "UPDATE usuario_sesiones SET is_valid = FALSE WHERE id = %s"
    with db_transaction(conn) as cur:
        cur.execute(query, (jti,))


def invalidate_all_sessions_for_user(conn, user_id):
    """
    Revoca todas las sesiones activas de un usuario.
    """
    query = "UPDATE usuario_sesiones SET is_valid = FALSE WHERE usuario_id = %s AND is_valid = TRUE"
    with db_transaction(conn) as cur:
        cur.execute(query, (str(user_id),))


def get_session(conn, jti: str) -> Optional[dict]:
    """
    Obtiene una sesión específica por ID (jti).
    """
    query = """
        SELECT id, usuario_id as user_id, is_valid, expires_at
        FROM usuario_sesiones
        WHERE id = %s
    """
    with conn.cursor() as cur:
        cur.execute(query, (jti,))
        row = cur.fetchone()
        return dict(row) if row else None


def get_active_session_for_user(conn, user_id) -> Optional[dict]:
    """
    Devuelve la sesión activa más reciente del usuario.
    """
    query = """
        SELECT id, is_valid, expires_at
        FROM usuario_sesiones
        WHERE usuario_id = %s AND is_valid = TRUE
        ORDER BY created_at DESC
        LIMIT 1
    """
    with conn.cursor() as cur:
        cur.execute(query, (str(user_id),))
        row = cur.fetchone()
        return dict(row) if row else None
