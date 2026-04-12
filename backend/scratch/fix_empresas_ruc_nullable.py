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

def fix_empresas_ruc(cur, conn):
    print("\n=== Modificando tabla: empresas ===")
    
    try:
        # Check current status
        cur.execute("""
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'sistema_facturacion' AND table_name = 'empresas' AND column_name = 'ruc';
        """)
        col = cur.fetchone()
        
        if col:
            print(f"Estado actual de 'ruc': Nullable = {col['is_nullable']}")
            if col['is_nullable'] == 'NO':
                print("Cambiando a Nullable...")
                cur.execute("ALTER TABLE sistema_facturacion.empresas ALTER COLUMN ruc DROP NOT NULL;")
                conn.commit()
                print("Cambio realizado exitosamente.")
            else:
                print("La columna ya permite valores nulos.")
        else:
            print("No se encontró la columna 'ruc' en la tabla 'empresas'.")
            
    except Exception as e:
        print(f"Error al modificar tabla: {e}")
        conn.rollback()

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
        
        fix_empresas_ruc(cur, conn)
            
        conn.close()
    except Exception as e:
        # Avoid encoding issues by forcing string conversion
        print(f"Error detectado: {str(e).encode('ascii', 'ignore').decode('ascii')}")

if __name__ == "__main__":
    main()
