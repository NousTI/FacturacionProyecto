# backend/database/connection.py

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import HTTPException, status

from config import get_db_config


def get_db_connection():
    """
    Generador de conexión a PostgreSQL para FastAPI.
    Se usa con Depends y cierra la conexión automáticamente
    al terminar la petición.
    """
    config = get_db_config()
    try:
        conn = psycopg2.connect(
            host=config["host"],
            database=config["database"],
            user=config["user"],
            password=config["password"],
            port=config["port"],
            cursor_factory=RealDictCursor,  # Devuelve diccionarios en lugar de tuplas
        )
    except psycopg2.Error as e:
        # Fallar rápido con un error HTTP claro para evitar AttributeError posteriores.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo conectar a la base de datos",
        ) from e

    try:
        yield conn
    finally:
        conn.close()
