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

def main():
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
        
        print("\n=== VERIFICANDO CHECKS DE LA TABLA: suscripciones ===")
        
        query = """
        SELECT 
            conname as constraint_name,
            pg_get_constraintdef(c.oid) as definition
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE n.nspname = 'sistema_facturacion' 
          AND cl.relname = 'suscripciones'
          AND c.contype = 'c';
        """
        
        cur.execute(query)
        rows = cur.fetchall()
        
        if not rows:
            print("No se encontraron restricciones de tipo CHECK en la tabla.")
        else:
            for r in rows:
                print(f"\nConstraint: {r['constraint_name']}")
                print(f"Definition: {r['definition']}")

        # Also check columns just in case
        print("\n=== DETALLE DE COLUMNA: estado ===")
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'sistema_facturacion' AND table_name = 'suscripciones' AND column_name = 'estado';
        """)
        col = cur.fetchone()
        if col:
            print(f"  Columna: {col['column_name']}")
            print(f"  Tipo: {col['data_type']}")
            print(f"  Null: {col['is_nullable']}")
            print(f"  Default: {col['column_default']}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
