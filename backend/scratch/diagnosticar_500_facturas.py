import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Intentar cargar configuración del proyecto
try:
    sys.path.append(os.getcwd())
    from backend.src.config.env import env
except ImportError:
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
            host=getattr(env, 'DB_HOST', 'localhost'),
            database=getattr(env, 'DB_NAME', 'sistema_facturacion'),
            user=getattr(env, 'DB_USER', 'postgres'),
            password=getattr(env, 'DB_PASSWORD', 'password'),
            port=getattr(env, 'DB_PORT', 5432),
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        print("--- Analizando integridad de datos en facturas (v2) ---")
        
        cur.execute("""
            SELECT id, numero_factura, 
                   (CASE WHEN total_sin_impuestos IS NULL THEN 'SI' ELSE 'NO' END) as total_null,
                   (CASE WHEN snapshot_cliente IS NULL THEN 'SI' ELSE 'NO' END) as client_null,
                   (CASE WHEN snapshot_usuario IS NULL THEN 'SI' ELSE 'NO' END) as user_null,
                   (CASE WHEN NOT (snapshot_usuario ? 'email') THEN 'SI' ELSE 'NO' END) as user_email_missing
            FROM sistema_facturacion.facturas
            WHERE total_sin_impuestos IS NULL 
               OR snapshot_cliente IS NULL 
               OR snapshot_usuario IS NULL
               OR NOT (snapshot_usuario ? 'email')
            LIMIT 10;
        """)
        null_rows = cur.fetchall()
        
        if null_rows:
            print(f"Se encontraron {len(null_rows)} registros con problemas:")
            for row in null_rows:
                print(f"ID: {row['id']} | Total-NULL: {row['total_null']} | User-NULL: {row['user_null']} | UserEmail-MISSING: {row['user_email_missing']}")
        else:
            print("TODO OK: No se encontraron nulos ni campos faltantes en snapshots.")

        conn.close()
    except Exception as e:
        print(f"Error diagnostics: {e}")

if __name__ == "__main__":
    main()
