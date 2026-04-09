import psycopg2
from psycopg2.extras import RealDictCursor, register_uuid
from typing import Generator
from ..config.env import env

def get_db_connection_raw():
    """
    Crea una conexión raw a PostgreSQL usando psycopg2.
    Útil para tareas en segundo plano o scripts.
    """
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT,
            cursor_factory=RealDictCursor,
            client_encoding="UTF8"
        )
        # Habilitar manejo nativo de UUID
        register_uuid(conn_or_curs=conn)
        
        # Establecer esquema por defecto
        with conn.cursor() as cur:
            cur.execute("SET search_path TO sistema_facturacion, public")
            
        return conn
    except Exception as e:
        print(f"Error fatal de BD: {e}")
        raise e

def get_db() -> Generator:
    """
    Dependencia de FastAPI para obtener conexión a BD.
    Se asegura de cerrar la conexión al finalizar.
    """
    conn = get_db_connection_raw()
    try:
        yield conn
    finally:
        conn.close()
