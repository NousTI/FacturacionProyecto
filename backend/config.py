"""Configuracion de la base de datos usando variables de entorno."""

from settings import get_settings


def get_db_config():
    """
    Retorna un diccionario con la configuracion de la base de datos
    usando settings centralizados.
    """
    settings = get_settings()
    return {
        "host": settings.db_host,
        "database": settings.db_name,
        "user": settings.db_user,
        "password": settings.db_password,
        "port": settings.db_port,
    }
