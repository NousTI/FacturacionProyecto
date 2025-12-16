# backend/repositories/session_repository.py

from datetime import datetime, timedelta, timezone

from database.transaction import db_transaction


def create_session(conn, user_id, jti, user_agent=None, ip_address=None, duration_minutes=60):
    """
    Crea una nueva sesión en la base de datos.
    """
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)).replace(tzinfo=None)

    with db_transaction(conn) as cur:
        cur.execute(
            """
            INSERT INTO usuario_sesiones (id, usuario_id, is_valid, expires_at, user_agent, ip_address)
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
            UPDATE usuario_sesiones
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
            UPDATE usuario_sesiones
            SET is_valid = FALSE
            WHERE usuario_id = %s AND is_valid = TRUE
            """,
            (str(user_id),), # Ensure UUID string if user_id is UUID object
        )


def get_session(conn, jti: str):
    """
    Obtiene una sesión específica por ID (jti).
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, usuario_id as user_id, is_valid, expires_at
            FROM usuario_sesiones
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
            FROM usuario_sesiones
            WHERE usuario_id = %s AND is_valid = TRUE
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (str(user_id),),
        )
        return cur.fetchone()
