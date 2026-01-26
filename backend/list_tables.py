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
    
    cur.execute("""
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    """)
    tables = cur.fetchall()
    print("Tablas encontradas:")
    for t in tables:
        print(f"- {t['table_schema']}.{t['table_name']}")
        
    conn.close()

if __name__ == "__main__":
    check()
