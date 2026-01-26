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
    
    # Check for schemas
    cur.execute("SELECT schema_name FROM information_schema.schemata")
    schemas = [s['schema_name'] for s in cur.fetchall()]
    print(f"Esquemas disponibles: {schemas}")
    
    target_schema = "public"
    if "sistema_facturacion" in schemas:
        target_schema = "sistema_facturacion"
        print("Usando esquema sistema_facturacion")
    else:
        print("Usando esquema public (sistema_facturacion no encontrado)")

    # Check for companies
    try:
        cur.execute(f"SELECT id, ruc, razon_social FROM {target_schema}.empresa LIMIT 5")
        companies = cur.fetchall()
        print("\nEmpresas:")
        for c in companies:
            print(f"- {c['id']} | {c['ruc']} | {c['razon_social']}")
    except Exception as e:
        print(f"\nError al buscar empresas: {e}")
        conn.rollback()
        
    # Check for the role
    role_id = "9c48c3c8-2c22-4711-8ef8-7bb6eb7e9780"
    try:
        cur.execute(f"SELECT id, nombre, empresa_id FROM {target_schema}.rol WHERE id = %s", (role_id,))
        role = cur.fetchone()
        if role:
            print(f"\nRol Superadmin encontrado: {role['nombre']} (ID: {role['id']}) en Empresa: {role['empresa_id']}")
        else:
            cur.execute(f"SELECT id, nombre, empresa_id FROM {target_schema}.rol WHERE codigo ILIKE '%superadmin%'")
            roles = cur.fetchall()
            print(f"\nRol Superadmin NO encontrado con ID: {role_id}")
            print("Roles similares:")
            for r in roles:
                 print(f"- {r['id']} | {r['nombre']} | {r['empresa_id']}")
    except Exception as e:
        print(f"\nError al buscar roles: {e}")
        conn.rollback()

    conn.close()

if __name__ == "__main__":
    check()
