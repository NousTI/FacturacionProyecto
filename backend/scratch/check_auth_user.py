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

def check_global_user(target_id):
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
        
        print(f"Buscando en sistema_facturacion.users (AUTH) id: {target_id}")
        cur.execute("SELECT id, email FROM sistema_facturacion.users WHERE id = %s", (target_id,))
        u = cur.fetchone()
        if u:
            print(f"Encontrado en tabla GLOBAL USERS: {u}")
            
            print("\nBuscando su perfil en sistema_facturacion.usuarios...")
            cur.execute("SELECT id, nombres, apellidos FROM sistema_facturacion.usuarios WHERE user_id = %s", (target_id,))
            prof = cur.fetchone()
            if prof:
                print(f"PERFIL ENCONTRADO (Este es el que se debe usar): {prof}")
            else:
                print("No tiene perfil 'usuario' vinculado a este user_id global.")
        else:
            print("Tampoco existe en la tabla GLOBAL USERS.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    target = "128622bf-f621-4404-9d1a-50fb2efb4c2f"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    check_global_user(target)
