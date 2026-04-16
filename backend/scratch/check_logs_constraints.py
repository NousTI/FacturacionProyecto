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
    conn = None
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

        print("\n" + "="*60)
        print("CHECK CONSTRAINTS en users_logs")
        print("="*60)
        cur.execute("""
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'sistema_facturacion.users_logs'::regclass
              AND contype = 'c';
        """)
        for row in cur.fetchall():
            print(f"  [{row['conname']}]: {row['definition']}")

        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
