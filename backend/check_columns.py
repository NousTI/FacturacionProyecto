from src.database.session import get_db

conn = next(get_db())
with conn.cursor() as cur:
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sistema_facturacion' AND table_name = 'suscripciones'")
    print('SUSCRIPCIONES:', cur.fetchall())
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sistema_facturacion' AND table_name = 'planes'")
    print('PLANES:', cur.fetchall())
