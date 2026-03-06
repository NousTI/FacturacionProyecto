import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        dbname=os.getenv("DB_NAME", "postgres")
    )
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT id, razon_social, vendedor_id FROM sistema_facturacion.empresas;")
    empresas = cur.fetchall()
    
    cur.execute("SELECT id, user_id FROM sistema_facturacion.vendedores;")
    vendedores = cur.fetchall()
    
    with open("test_db_out_utf8.txt", "w", encoding="utf-8") as f:
        f.write("=== EMPRESAS ===\n")
        for e in empresas:
            f.write(str(dict(e)) + "\n")
        f.write("=== VENDEDORES ===\n")
        for v in vendedores:
            f.write(str(dict(v)) + "\n")

    conn.close()
except Exception as e:
    print("Error:", e)
