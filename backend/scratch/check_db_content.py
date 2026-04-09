import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def check_db():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "sistema_facturacion"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "password"),
            port=os.getenv("DB_PORT", "5432"),
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        print("--- Checking tables in all schemas ---")
        cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'categoria_gasto'")
        tables = cur.fetchall()
        for t in tables:
            print(f"Found table: {t['table_schema']}.{t['table_name']}")
            
            cur.execute(f"SELECT COUNT(*) FROM {t['table_schema']}.{t['table_name']}")
            count = cur.fetchone()['count']
            print(f"  Rows in {t['table_schema']}.{t['table_name']}: {count}")
            
            if count > 0:
                cur.execute(f"SELECT * FROM {t['table_schema']}.{t['table_name']}")
                rows = cur.fetchall()
                for r in rows:
                    print(f"    - ID: {r['id']}, Code: {r['codigo']}, Empresa: {r['empresa_id']}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
