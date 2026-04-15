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
        
        print("\n=== COLUMNAS DE LA TABLA: planes ===")
        cur.execute("""
            SELECT column_name, data_type, numeric_precision, numeric_scale
            FROM information_schema.columns
            WHERE table_schema = 'sistema_facturacion' AND table_name = 'planes'
            ORDER BY ordinal_position;
        """)
        cols = cur.fetchall()
        for c in cols:
            print(f"  Col: {c['column_name']} | Type: {c['data_type']} | Precision: {c['numeric_precision']} | Scale: {c['numeric_scale']}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
