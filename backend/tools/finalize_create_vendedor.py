import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext
from uuid import uuid4

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def get_db():
    try:
        conn = psycopg2.connect(host="localhost", database="sistema_facturacion", user="postgres", password="password", port=5432, cursor_factory=RealDictCursor)
        return conn
    except:
        conn = psycopg2.connect(host="localhost", database="sistema_facturacion", user="postgres", password="admin", port=5432, cursor_factory=RealDictCursor)
        return conn

def create_superadmin():
    conn = get_db()
    cur = conn.cursor()
    
    email = "vendedor@empresa.com"
    password = "password"
    role_id = "3c215efa-3d7f-4c0d-8a92-35edbec5737d"
    user_id = str(uuid4())
    pass_hash = get_password_hash(password)
    
    try:
        # 1. Insert into users
        cur.execute("""
            INSERT INTO sistema_facturacion.users (id, email, password_hash, estado)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (user_id, email, pass_hash, 'ACTIVA'))
        print(f"Usuario creado en users: {email}")

        # 2. Insert into user_roles
        cur.execute("""
            INSERT INTO sistema_facturacion.user_roles (user_id, role_id)
            VALUES (%s, %s)
        """, (user_id, role_id))
        print(f"Rol asignado: {role_id}")

        # 3. Insert into superadmin profile
        cur.execute("""
            INSERT INTO sistema_facturacion.superadmin (user_id, nombres, apellidos, activo)
            VALUES (%s, %s, %s, %s)
        """, (user_id, 'Super', 'Admin', True))
        print("Perfil de Superadmin creado")

        conn.commit()
        print("\n¡Todo listo! Superadmin creado exitosamente.")
    except Exception as e:
        conn.rollback()
        print(f"\nError al crear superadmin: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_superadmin()
