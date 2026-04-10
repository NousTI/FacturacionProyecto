
import psycopg2
import os

def migrate():
    # Try different connection strings based on .env
    conn_str1 = "dbname=sistema_facturacion user=postgres password=admin host=localhost port=5432"
    conn_str2 = "dbname=sistema_facturacion user=postgres password=password host=localhost port=5432"
    
    conn = None
    for dsn in [conn_str1, conn_str2]:
        try:
            print(f"Trying to connect with: {dsn.replace('password=admin', 'password=***').replace('password=password', 'password=***')}")
            conn = psycopg2.connect(dsn, client_encoding='UTF8')
            print("Connected successfully!")
            break
        except Exception as e:
            print(f"Connection failed: {e}")
    
    if not conn:
        print("Could not connect to database with any known credentials.")
        return

    try:
        with conn.cursor() as cur:
            cur.execute("SET search_path TO sistema_facturacion, public")
            # Check if column exists
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'sistema_facturacion' AND table_name = 'pagos_suscripciones' AND column_name = 'tipo_pago'")
            if not cur.fetchone():
                print("Adding tipo_pago column...")
                cur.execute("ALTER TABLE sistema_facturacion.pagos_suscripciones ADD COLUMN tipo_pago VARCHAR(20) DEFAULT 'NUEVO'")
                conn.commit()
                print("Column added successfully.")
            else:
                print("Column already exists.")
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
