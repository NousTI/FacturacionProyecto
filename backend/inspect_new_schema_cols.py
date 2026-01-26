import psycopg2
from psycopg2.extras import RealDictCursor

def get_db():
    try:
        conn = psycopg2.connect(host="localhost", database="sistema_facturacion", user="postgres", password="password", port=5432, cursor_factory=RealDictCursor)
        return conn
    except:
        conn = psycopg2.connect(host="localhost", database="sistema_facturacion", user="postgres", password="admin", port=5432, cursor_factory=RealDictCursor)
        return conn

def inspect():
    conn = get_db()
    cur = conn.cursor()
    
    for table in ['users', 'roles', 'user_roles', 'superadmin']:
        cur.execute(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'sistema_facturacion' AND table_name = '{table}'")
        cols = cur.fetchall()
        print(f"\nTablas: sistema_facturacion.{table}")
        for c in cols:
            print(f"- {c['column_name']} ({c['data_type']}) | Nullable: {c['is_nullable']}")
            
    conn.close()

if __name__ == "__main__":
    inspect()
