import psycopg2
import sys
import os

sys.path.append(os.getcwd())
from src.config.env import env

conn = psycopg2.connect(
    host=env.DB_HOST,
    database=env.DB_NAME,
    user=env.DB_USER,
    password=env.DB_PASSWORD,
    port=env.DB_PORT
)
cur = conn.cursor()
cur.execute("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'pago_gasto_metodo_pago_check';")
result = cur.fetchone()
if result:
    print("CONSTRAINT DEFINITION:", result[0])
else:
    print("Constraint not found.")
conn.close()
