import psycopg2
from psycopg2.extras import RealDictCursor
import sys
import os

try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except ImportError:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password"
        DB_PORT = 5432
    env = MockEnv()

def check_counts():
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT tipo_contribuyente, count(*) FROM sistema_facturacion.empresas GROUP BY tipo_contribuyente;")
        rows = cur.fetchall()
        print("\nConteo por tipo_contribuyente:")
        for r in rows:
            print(f"  - {r['tipo_contribuyente']}: {r['count']}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_counts()
