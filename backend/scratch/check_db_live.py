import psycopg2
from psycopg2.extras import RealDictCursor
import sys

# Connection details from .env
# We'll try to connect using the DATABASE_URL pattern if possible, 
# or fall back to individual parameters.
DB_URL = "postgresql://postgres:admin@localhost:5432/sistema_facturacion"

def check_table(cur, table_name):
    print(f"\n=== Verificando tabla: {table_name} ===")
    
    # 1. Columnas y Tipos
    cur.execute(f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'sistema_facturacion' AND table_name = '{table_name}'
        ORDER BY ordinal_position;
    """)
    cols = cur.fetchall()
    print("--- Columnas ---")
    for col in cols:
        default = col['column_default'] if col['column_default'] else 'None'
        print(f"  {col['column_name']}: {col['data_type']} (Nullable: {col['is_nullable']}, Default: {default})")

    # 2. Constraints (Check y Unique)
    cur.execute(f"""
        SELECT conname, pg_get_constraintdef(c.oid) as definition
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'sistema_facturacion' AND conrelid = 'sistema_facturacion.{table_name}'::regclass;
    """)
    constraints = cur.fetchall()
    print("--- Restricciones (Constraints) ---")
    for con in constraints:
        print(f"  {con['conname']}: {con['definition']}")

    # 3. Datos de muestra (Distinct tipo_identificacion)
    try:
        cur.execute(f"SELECT DISTINCT tipo_identificacion FROM sistema_facturacion.{table_name};")
        values = cur.fetchall()
        print("--- Valores actuales de tipo_identificacion ---")
        for val in values:
            print(f"  - '{val['tipo_identificacion']}'")
    except Exception as e:
        print(f"  Error al leer datos: {e}")

def main():
    conn = None
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        tables = ["clientes", "proveedores", "vendedores"]
        for table in tables:
            # Check if table exists
            cur.execute(f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'sistema_facturacion' AND table_name = '{table}')")
            if cur.fetchone()['exists']:
                check_table(cur, table)
            else:
                print(f"\n[AVISO] La tabla 'sistema_facturacion.{table}' no existe.")
            
    except Exception as e:
        print(f"ERROR DE CONEXIÓN: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
