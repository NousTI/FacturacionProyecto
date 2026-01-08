# backend/database/connection.py

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import HTTPException, status

from config import get_db_config


def get_db_connection_raw():
    """
    Returns a raw connection to PostgreSQL.
    To be used in background tasks where Depends is not available.
    Must be closed manually!
    """
    config = get_db_config()
    # Debug print to verify encoding
    # print(f"Connecting to DB: host={config['host']} db={config['database']} user={config['user']}")

    try:
        conn = psycopg2.connect(
            host=config["host"],
            database=config["database"],
            user=config["user"],
            password=config["password"],
            port=config["port"],
            cursor_factory=RealDictCursor,
            client_encoding="UTF8"
        )
        return conn
    except (psycopg2.Error, UnicodeDecodeError) as e:
        # UnicodeDecodeError happens on Windows when Postgres sends localized error messages (e.g. "Autenticación fallida")
        # and psycopg2 fails to decode 'ó' as UTF-8. 
        # We treat this as a likely connection/auth failure.
        print(f"DB Connection Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Error conectando a BD. Verifique credenciales en .env (Posible error de codificación en mensaje de error)",
        ) from e

def get_db_connection():
    """
    FastAPI dependency generator.
    Se usa con Depends y cierra la conexión automáticamente
    al terminar la petición.
    """
    conn = get_db_connection_raw()

    try:
        yield conn
    finally:
        conn.close()
