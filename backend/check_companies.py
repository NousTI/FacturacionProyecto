import psycopg2
from psycopg2.extras import RealDictCursor

def get_db():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="sistema_facturacion",
            user="postgres",
            password="password", # Try password first
            port=5432,
            cursor_factory=RealDictCursor
        )
        return conn
    except:
        conn = psycopg2.connect(
            host="localhost",
            database="sistema_facturacion",
            user="postgres",
            password="admin", # Try admin second
            port=5432,
            cursor_factory=RealDictCursor
        )
        return conn

def check():
    conn = get_db()
    cur = conn.cursor()
    
    # Check for companies
    cur.execute("SELECT id, ruc, razon_social FROM sistema_facturacion.empresa LIMIT 5")
    companies = cur.fetchall()
    print("Empresas:")
    for c in companies:
        print(f"- {c['id']} | {c['ruc']} | {c['razon_social']}")
        
    # Check for the role
    role_id = "9c48c3c8-2c22-4711-8ef8-7bb6eb7e9780"
    cur.execute("SELECT * FROM sistema_facturacion.rol WHERE id = %s", (role_id,))
    role = cur.fetchone()
    if role:
        print(f"\nRol Superadmin encontrado: {role['nombre']} (ID: {role['id']})")
    else:
        print(f"\nRol Superadmin NO encontrado con ID: {role_id}")
        
    conn.close()

if __name__ == "__main__":
    check()
