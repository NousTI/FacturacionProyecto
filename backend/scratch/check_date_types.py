import psycopg2
import os
import sys

# Add current directory to path to import env
sys.path.append(os.getcwd())
from src.config.env import env

def check_field_types():
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT
        )
        cur = conn.cursor()
        
        # Check pagos_factura.fecha_pago
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'sistema_facturacion' 
              AND table_name = 'pagos_factura' 
              AND column_name = 'fecha_pago'
        """)
        print(f"pagos_factura.fecha_pago: {cur.fetchone()}")
        
        # Check facturas.fecha_emision
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'sistema_facturacion' 
              AND table_name = 'facturas' 
              AND column_name = 'fecha_emision'
        """)
        print(f"facturas.fecha_emision: {cur.fetchone()}")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_field_types()
