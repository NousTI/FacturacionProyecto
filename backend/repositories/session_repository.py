# backend/repositories/session_repository.py

from datetime import datetime, timedelta, timezone

from database.transaction import db_transaction


def create_session(conn, user_id, jti, user_agent=None, ip_address=None, duration_minutes=60):
    """
    Crea una nueva sesión en la base de datos.
    """
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)

    with db_transaction(conn) as cur:
        cur.execute(
            """
            INSERT INTO user_sessions (id, user_id, is_valid, expires_at, user_agent, ip_address)
            VALUES (%s, %s, TRUE, %s, %s, %s)
            """,
            (jti, user_id, expires_at, user_agent, ip_address),
        )

    return jti


def invalidate_session(conn, jti: str):
    """
    Marca una sesión como inválida (logout).
    """
    with db_transaction(conn) as cur:
        cur.execute(
            """
            UPDATE user_sessions
            SET is_valid = FALSE
            WHERE id = %s
            """,
            (jti,),
        )


def invalidate_all_sessions_for_user(conn, user_id: int):
    """
    Revoca todas las sesiones activas de un usuario.
    (Ya no se usa en sesiones únicas, pero disponible si cambias la lógica.)
    """
    with db_transaction(conn) as cur:
        cur.execute(
            """
            UPDATE user_sessions
            SET is_valid = FALSE
            WHERE user_id = %s AND is_valid = TRUE
            """,
            (user_id,),
        )


def get_session(conn, jti: str):
    """
    Obtiene una sesión específica por ID (jti).
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, user_id, is_valid, expires_at
            FROM user_sessions
            WHERE id = %s
            """,
            (jti,),
        )
        return cur.fetchone()


def get_active_session_for_user(conn, user_id: int):
    """
    Devuelve la sesión activa más reciente del usuario.
    Si hay varias por error, toma la más nueva.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, is_valid, expires_at
            FROM user_sessions
            WHERE user_id = %s AND is_valid = TRUE
            ORDER BY expires_at DESC
            LIMIT 1
            """,
            (user_id,),
        )
        return cur.fetchone()
