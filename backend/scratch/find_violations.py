import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

DB_HOST = "localhost"
DB_NAME = "sistema_facturacion"
DB_USER = "postgres"
DB_PASSWORD = "password"
DB_PORT = 5432

def find_violating_rows():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        # Fórmula esperada: 
        # total = round(subtotal_sin_iva + subtotal_con_iva + subtotal_no_objeto_iva + subtotal_exento_iva + iva + propina - (descuento + retencion_iva + retencion_renta), 2)
        
        cur.execute("""
            SELECT id, total, 
                   round((subtotal_sin_iva + subtotal_con_iva + subtotal_no_objeto_iva + subtotal_exento_iva + iva + propina) - 
                         (descuento + retencion_iva + retencion_renta), 2) as calculado,
                   subtotal_con_iva, iva, descuento
            FROM sistema_facturacion.facturas
            WHERE total != round((subtotal_sin_iva + subtotal_con_iva + subtotal_no_objeto_iva + subtotal_exento_iva + iva + propina) - 
                               (descuento + retencion_iva + retencion_renta), 2);
        """)
        
        rows = cur.fetchall()
        print(f"Found {len(rows)} violating rows:")
        for row in rows:
            print(f"ID: {row['id']} | Total: {row['total']} | Calculado: {row['calculado']} | Diff: {row['total'] - row['calculado']}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_violating_rows()
