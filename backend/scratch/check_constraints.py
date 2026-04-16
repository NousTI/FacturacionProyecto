import psycopg2
from psycopg2.extras import RealDictCursor
import sys
import os

# Add src to path to import env
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
from config.env import env

def check_constraints():
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
            query = """
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                JOIN information_schema.referential_constraints AS rc
                  ON rc.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('usuarios', 'superadmin', 'vendedores');
            """
            cur.execute(query)
            rows = cur.fetchall()
            for row in rows:
                print(f"Table: {row['table_name']}.{row['column_name']} -> {row['foreign_table_name']}.{row['foreign_column_name']} (DELETE: {row['delete_rule']})")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_constraints()
