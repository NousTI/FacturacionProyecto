
import sys
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Add parent directory to sys.path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from config import get_db_config
except ImportError:
    # Fallback if config not found (e.g. running from wrong dir)
    print("Could not import config. Using defaults/env vars.")
    def get_db_config():
        return {
            "host": os.getenv("DB_HOST", "localhost"),
            "database": os.getenv("DB_NAME", "facturacion_db"),
            "user": os.getenv("DB_USER", "postgres"),
            "password": os.getenv("DB_PASSWORD", "admin"),
            "port": os.getenv("DB_PORT", "5432")
        }

def fix_table():
    config = get_db_config()
    print(f"Connecting to {config['host']}:{config['port']}/{config['database']} as {config['user']}")
    
    try:
        conn = psycopg2.connect(**config)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("SELECT to_regclass('public.autorizacion_sri');")
        exists = cur.fetchone()[0]
        
        if exists:
            print("Table 'autorizacion_sri' exists.")
            cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'autorizacion_sri'")
            cols = cur.fetchall()
            for c in cols:
                print(f" - {c[0]}: {c[1]}")
        else:
            print("Table 'autorizacion_sri' DOES NOT EXIST. Creating it...")
            create_sql = """
            CREATE TABLE public.autorizacion_sri (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                factura_id UUID NOT NULL UNIQUE,
                numero_autorizacion VARCHAR(255),
                fecha_autorizacion TIMESTAMP,
                estado VARCHAR(50) NOT NULL,
                mensajes TEXT,
                xml_enviado TEXT,
                xml_respuesta TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
            );
            """
            cur.execute(create_sql)
            print("Table created successfully.")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_table()
