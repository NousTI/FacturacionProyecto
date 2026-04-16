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
    cur.execute("ALTER TABLE sistema_facturacion.pago_gasto DROP CONSTRAINT IF EXISTS pago_gasto_metodo_pago_check;")
    
    print("Adding new constraint with SRI codes and legacy values...")
    new_constraint = """
    ALTER TABLE sistema_facturacion.pago_gasto 
    ADD CONSTRAINT pago_gasto_metodo_pago_check 
    CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque', '01', '15', '16', '17', '18', '19', '20', '21'));
    """
    cur.execute(new_constraint)
    
    print("Successfully updated constraint.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
