import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Mocking config/env for standalone run
class Env:
    DB_HOST = "localhost"
    DB_NAME = "sistema_facturacion"
    DB_USER = "postgres"
    DB_PASSWORD = "password" 
    DB_PORT = 5432

# Try to find real env
try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except:
    env = Env()

def test_queries():
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT,
            cursor_factory=RealDictCursor
        )
        with conn.cursor() as cur:
            print("Checking columns of notificaciones table...")
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'sistema_facturacion' AND table_name = 'notificaciones'")
            columns = [r['column_name'] for r in cur.fetchall()]
            print(f"Columns: {columns}")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_queries()
