import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def check_user_tables():
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
        
        cur.execute("SELECT COUNT(*) FROM usuarios")
        print(f"Rows in usuarios: {cur.fetchone()['count']}")
        
        cur.execute("SELECT COUNT(*) FROM users")
        print(f"Rows in users: {cur.fetchone()['count']}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_user_tables()
