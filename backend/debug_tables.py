import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.config.env import env

def list_tables():
    output = []
    try:
        conn = psycopg2.connect(host=env.DB_HOST, database=env.DB_NAME, user=env.DB_USER, password=env.DB_PASSWORD, port=env.DB_PORT, cursor_factory=RealDictCursor)
        with conn.cursor() as cur:
            cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'sistema_facturacion') ORDER BY table_schema, table_name;")
            rows = cur.fetchall()
            for r in rows:
                output.append(f"SCHEMA: {r['table_schema']} | TABLE: {r['table_name']}")
        conn.close()
        with open('tables_list.txt', 'w', encoding='utf-8') as f:
            f.write('\n'.join(output))
    except Exception as e:
        with open('tables_error.txt', 'w', encoding='utf-8') as f:
            f.write(str(e))

if __name__ == "__main__":
    list_tables()
