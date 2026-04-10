import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME", "facturacion_db"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", "postgres"),
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432")
)

with conn.cursor() as cur:
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'sistema_facturacion' AND table_name = 'facturas'")
    cols = [r[0] for r in cur.fetchall()]
    print("FACTURAS COLS:", cols)
    
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'sistema_facturacion' AND table_name = 'facturas_detalle'")
    cols_det = [r[0] for r in cur.fetchall()]
    print("DETALLE COLS:", cols_det)

conn.close()
