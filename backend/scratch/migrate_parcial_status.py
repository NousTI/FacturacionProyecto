import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def migrate_estado_pago():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "sistema_facturacion"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "password"),
            port=os.getenv("DB_PORT", "5432")
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute("SET search_path TO sistema_facturacion, public")
        
        print("Dropping old check constraint...")
        cur.execute("ALTER TABLE gastos DROP CONSTRAINT IF EXISTS gastos_estado_pago_check")
        
        print("Adding new check constraint with 'parcial'...")
        cur.execute("""
            ALTER TABLE gastos ADD CONSTRAINT gastos_estado_pago_check 
            CHECK (estado_pago IN ('pendiente', 'parcial', 'pagado', 'vencido', 'cancelado', 'reembolsado'))
        """)
        
        print("Database migration successful!")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate_estado_pago()
