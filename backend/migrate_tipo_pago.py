
import sys
import os

# Añadir el directorio src al path para poder importar
sys.path.append(os.path.join(os.getcwd(), 'src'))

try:
    from database.session import get_db_connection_raw
    
    def migrate():
        conn = get_db_connection_raw()
        try:
            with conn.cursor() as cur:
                # El search_path ya está seteado en get_db_connection_raw
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
except Exception as e:
    print(f"Setup error: {e}")
