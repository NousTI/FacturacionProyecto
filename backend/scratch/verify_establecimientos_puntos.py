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
        cur.execute(f"SELECT COUNT(*) as total FROM sistema_facturacion.{table_name};")
        row_count = cur.fetchone()['total']
        print(f"--- Total de registros: {row_count} ---")
        
        if row_count > 0:
            cur.execute(f"SELECT * FROM sistema_facturacion.{table_name} LIMIT 3;")
            samples = cur.fetchall()
            print("--- Muestras de datos ---")
            for sample in samples:
                # Remove timestamps for cleaner output
                sample_clean = {k: v for k, v in sample.items() if k not in ['created_at', 'updated_at']}
                print(f"  {sample_clean}")
    except Exception as e:
        print(f"  Error al leer datos: {e}")

def main():
    conn = None
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT,
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        tables = ["establecimientos", "puntos_emision"]
        for table in tables:
            check_table(cur, table)
            
        conn.close()
    except Exception as e:
        print(f"Error detectado: {str(e)}")

if __name__ == "__main__":
    main()
