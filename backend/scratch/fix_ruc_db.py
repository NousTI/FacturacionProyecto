import psycopg2

connection_string = "postgresql://postgres:password@localhost:5432/sistema_facturacion"

def update_db():
    try:
        conn = psycopg2.connect(connection_string)
        conn.autocommit = True
        with conn.cursor() as cur:
            # Drop the NOT NULL constraint
            cur.execute("ALTER TABLE sistema_facturacion.empresas ALTER COLUMN ruc DROP NOT NULL;")
            print("Successfully removed NOT NULL constraint from 'ruc' column.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    update_db()
