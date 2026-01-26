import psycopg2
from psycopg2.extras import RealDictCursor

def get_db():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="sistema_facturacion",
            user="postgres",
            password="password",
            port=5432,
            cursor_factory=RealDictCursor
        )
        return conn
    except:
        conn = psycopg2.connect(
            host="localhost",
            database="sistema_facturacion",
            user="postgres",
            password="admin",
            port=5432,
            cursor_factory=RealDictCursor
        )
        return conn

def check():
    conn = get_db()
    cur = conn.cursor()
    
    role_id = "9c48c3c8-2c22-4711-8ef8-7bb6eb7e9780"
    
    # Check roles in sistema_facturacion
    cur.execute("SELECT * FROM sistema_facturacion.roles WHERE id = %s", (role_id,))
    role = cur.fetchone()
    if role:
        print(f"Rol encontrado en sistema_facturacion.roles: {role['codigo']} (ID: {role['id']})")
    else:
        print(f"Rol {role_id} NO encontrado en sistema_facturacion.roles")
        cur.execute("SELECT id, codigo FROM sistema_facturacion.roles")
        roles = cur.fetchall()
        print("Roles existentes:")
        for r in roles:
            print(f"- {r['id']} | {r['codigo']}")

    # Check users
    cur.execute("SELECT id, email FROM sistema_facturacion.users")
    users = cur.fetchall()
    print("\nUsuarios existentes:")
    for u in users:
        print(f"- {u['id']} | {u['email']}")

    conn.close()

if __name__ == "__main__":
    check()
