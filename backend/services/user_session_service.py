# backend/services/session_service.py

from datetime import datetime, timezone

from repositories.user_sessions_repository import (
    create_session,
    invalidate_session,
    get_session,
    get_active_session_for_user,
)


def now_utc():
    """Retorna la hora actual en UTC con zona horaria."""
    return datetime.now(timezone.utc)


def start_user_session(conn, user_id, jti, user_agent=None, ip_address=None):
    """
    Intenta iniciar sesión.
    Si el usuario ya tiene una sesión activa NO se crea una nueva.
    """
    active_session = get_active_session_for_user(conn, user_id)

    if active_session:
        expires_at = active_session["expires_at"]

        # Asegurar que expires_at tenga zona horaria
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        # Si aún no expira, bloquear login
        if expires_at > now_utc():
            return None

        # Si ya expiró, marcar como inválida
        invalidate_session(conn, active_session["id"])

    # Crear nueva sesión
    session_id = create_session(conn, user_id, jti, user_agent, ip_address)
    return session_id


def validate_session(conn, session_id: str):
    """
    Valida que la sesión exista, esté activa y no haya expirado.
    """
    session = get_session(conn, session_id)

    if not session:
        return False

    if not session["is_valid"]:
        return False

    expires_at = session["expires_at"]

    # Asegurar zona horaria para evitar comparaciones inválidas
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    # Si expira, invalidarla automáticamente
    if expires_at < now_utc():
        invalidate_session(conn, session_id)
        return False

    return True


def end_user_session(conn, session_id: str):
    """Cierra sesión manualmente (logout)."""
    invalidate_session(conn, session_id)
    return True


def end_all_user_sessions(conn, user_id: int):
    """Revoca todas las sesiones activas del usuario."""
    invalidate_all_sessions_for_user(conn, user_id)
    return True
