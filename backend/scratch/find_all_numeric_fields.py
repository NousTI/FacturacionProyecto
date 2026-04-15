import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password" 
        DB_PORT = 5432
    env = MockEnv()

def main():
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT,
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        print("\n=== BUSCANDO COLUMNAS NUMERIC(10,2) EN TODO EL ESQUEMA ===")
        cur.execute("""
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE table_schema = 'sistema_facturacion' 
              AND data_type = 'numeric'
              AND numeric_precision = 10
              AND numeric_scale = 2;
        """)
        rows = cur.fetchall()
        for r in rows:
            print(f"  Tabla: {r['table_name']} | Columna: {r['column_name']}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
