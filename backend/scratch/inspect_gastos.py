import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def inspect_gastos():
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
        cur.execute("SET search_path TO sistema_facturacion, public")
        
        print("--- Columns in gastos ---")
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'gastos'")
        for col in cur.fetchall():
            print(f"- {col['column_name']} ({col['data_type']})")
            
        print("\n--- Foreign Keys in gastos ---")
        cur.execute("""
            SELECT
                tc.constraint_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='gastos';
        """)
        for fk in cur.fetchall():
            print(f"- {fk['constraint_name']}: {fk['column_name']} -> {fk['foreign_table_name']}({fk['foreign_column_name']})")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_gastos()
