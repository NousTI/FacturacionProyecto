import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Try to find real env
try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password" 
        DB_PORT = 5432
    env = MockEnv()

def check_structure():
    conn = None
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT,
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        tables = ["log_pago_facturas", "pagos_factura", "cuentas_cobrar", "facturas"]
        
        for table in tables:
            print(f"\n--- DATA SAMPLE: {table} ---")
            cur.execute(f"SELECT COUNT(*) as total FROM sistema_facturacion.{table}")
            print(f"Total rows: {cur.fetchone()['total']}")
            
            cur.execute(f"SELECT * FROM sistema_facturacion.{table} LIMIT 2")
            rows = cur.fetchall()
            for row in rows:
                print(row)

        print("\n--- CHECKING JOIN FOR R-028 ---")
        cur.execute("""
            SELECT lp.metodo_pago, lp.monto, lp.fecha_pago, f.estado
            FROM sistema_facturacion.log_pago_facturas lp
            JOIN sistema_facturacion.facturas f ON lp.factura_id = f.id
            LIMIT 5
        """)
        print("Join log_pago_facturas -> facturas:", cur.fetchall())

        cur.execute("""
            SELECT SUM(cc.monto_pagado) as total_recaudado
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            WHERE f.estado = 'AUTORIZADA'
        """)
        print("Recaudado Total (AUTORIZADA):", cur.fetchone())

        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    check_structure()
