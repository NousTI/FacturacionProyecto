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
        
        print("\n=== BUSCANDO TRIGGERS EN sistema_facturacion ===")
        cur.execute("""
            SELECT event_object_table as table, trigger_name, action_statement
            FROM information_schema.triggers
            WHERE event_object_schema = 'sistema_facturacion';
        """)
        rows = cur.fetchall()
        for r in rows:
            print(f"  Tabla: {r['table']} | Trigger: {r['trigger_name']}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
