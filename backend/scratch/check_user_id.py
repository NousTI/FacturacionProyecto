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

def check_user(target_id):
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
        
        print(f"Buscando usuario con ID: {target_id}")
        # Note: 'username' was missing, using 'nombres', 'apellidos'
        try:
            cur.execute("SELECT id, nombres, apellidos FROM sistema_facturacion.usuarios WHERE id = %s", (target_id,))
            user = cur.fetchone()
        except:
            print("Error al consultar por ID específico.")
            user = None
        
        if user:
            print(f"Usuario ENCONTRADO: {user}")
        else:
            print("Usuario NO ENCONTRADO.")
            print("\nListando todos los usuarios disponibles en sistema_facturacion.usuarios:")
            cur.execute("SELECT id, nombres, apellidos FROM sistema_facturacion.usuarios LIMIT 10")
            users = cur.fetchall()
            if not users:
                print("No hay registros en la tabla usuarios.")
            for u in users:
                print(f"  - {u['id']} ({u['nombres']} {u['apellidos']})")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    target = "128622bf-f621-4404-9d1a-50fb2efb4c2f"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    check_user(target)
