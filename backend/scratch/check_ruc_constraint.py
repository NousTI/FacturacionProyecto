import psycopg2
from psycopg2.extras import RealDictCursor

connection_string = "postgresql://postgres:postgres@localhost:5432/facturacion_db"

def check_schema():
    try:
        conn = psycopg2.connect(connection_string)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT column_name, is_nullable, column_default, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'sistema_facturacion' 
                AND table_name = 'empresas' 
                AND column_name = 'ruc';
            """)
            row = cur.fetchone()
            if row:
                print("Empresas RUC Column:")
                for k, v in row.items():
                    print(f"{k}: {v}")
            else:
                print("Column 'ruc' not found in system_facturacion.empresas")
            
            cur.execute("""
                SELECT conname, pg_get_constraintdef(c.oid)
                FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE n.nspname = 'sistema_facturacion'
                AND contype = 'u'
                AND pg_get_constraintdef(c.oid) LIKE '%ruc%';
            """)
            constraints = cur.fetchall()
            print("\nUnique Constraints on RUC:")
            for con in constraints:
                print(f"{con['conname']}: {con['pg_get_constraintdef']}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_schema()
