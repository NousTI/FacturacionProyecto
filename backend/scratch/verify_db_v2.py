import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Try to find real env
try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password" 
        DB_PORT = 5432
    env = MockEnv()

def check_table(cur, table_name):
    print(f"\n=== Verificando tabla: {table_name} ===")
    
    # 1. Columnas
    cur.execute(f"""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'sistema_facturacion' AND table_name = '{table_name}'
        ORDER BY ordinal_position;
    """)
    cols = cur.fetchall()
    print("--- Columnas ---")
    for col in cols:
        print(f"  {col['column_name']}: {col['data_type']} (Nullable: {col['is_nullable']})")

    # 2. Constraints
    cur.execute(f"""
        SELECT conname, pg_get_constraintdef(c.oid) as definition
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'sistema_facturacion' 
        AND conrelid = 'sistema_facturacion.{table_name}'::regclass;
    """)
    constraints = cur.fetchall()
    print("--- Restricciones ---")
    for con in constraints:
        print(f"  {con['conname']}: {con['definition']}")

    # 3. Data Samples
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
        # Use credentials from Env
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT,
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        tables = ["clientes", "proveedores", "vendedores"]
        for table in tables:
            check_table(cur, table)
            
        conn.close()
    except Exception as e:
        # Avoid encoding issues by forcing string conversion
        print(f"Error detectado: {str(e).encode('ascii', 'ignore').decode('ascii')}")

if __name__ == "__main__":
    main()
