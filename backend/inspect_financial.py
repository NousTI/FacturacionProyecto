import sys
import os

# Añadir src al path
sys.path.append(os.path.join(os.getcwd(), 'backend', 'src'))

from database.session import get_db_connection_raw

def inspect_financial_tables():
    conn = get_db_connection_raw()
    cur = conn.cursor()
    
    tables_to_inspect = ['facturas', 'facturas_detalle', 'gasto', 'productos', 'formas_pago']
    
    for table in tables_to_inspect:
        print(f"\n--- Columnas en sistema_facturacion.{table}: ---")
        cur.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{table}' AND table_schema = 'sistema_facturacion'
            ORDER BY ordinal_position
        """)
        columns = cur.fetchall()
        for c in columns:
            print(f"- {c['column_name']} ({c['data_type']})")

    conn.close()

if __name__ == "__main__":
    inspect_financial_tables()
