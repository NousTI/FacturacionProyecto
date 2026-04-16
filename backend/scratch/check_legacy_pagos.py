import psycopg2
import sys
import os

sys.path.append(os.getcwd())
from src.config.env import env

try:
    conn = psycopg2.connect(
        host=env.DB_HOST,
        database=env.DB_NAME,
        user=env.DB_USER,
        password=env.DB_PASSWORD,
        port=env.DB_PORT
    )
    cur = conn.cursor()
    cur.execute("SELECT metodo_pago, COUNT(*) FROM sistema_facturacion.pago_gasto GROUP BY metodo_pago;")
    rows = cur.fetchall()
    print("Mapeo actual de métodos de pago en la BD:")
    for r in rows:
        print(f" - '{r[0]}': {r[1]} registros")
        
except Exception as e:
    print(e)
finally:
    if 'conn' in locals(): conn.close()
