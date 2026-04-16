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
    conn.autocommit = True
    cur = conn.cursor()

    print("Dropping old constraint...")
    cur.execute("ALTER TABLE sistema_facturacion.users_logs DROP CONSTRAINT IF EXISTS users_logs_evento_check;")

    print("Adding new constraint with SRI events...")
    cur.execute("""
        ALTER TABLE sistema_facturacion.users_logs
        ADD CONSTRAINT users_logs_evento_check
        CHECK (evento = ANY (ARRAY[
            'LOGIN_OK',
            'LOGIN_FALLIDO',
            'LOGOUT',
            'PASSWORD_CAMBIADA',
            'CUENTA_BLOQUEADA',
            'CUENTA_DESBLOQUEADA',
            'CUENTA_DESHABILITADA',
            'SRI_CERTIFICADO_ACTUALIZADO',
            'SRI_CERTIFICADO_FALLIDO'
        ]));
    """)

    print("Constraint actualizado exitosamente.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
