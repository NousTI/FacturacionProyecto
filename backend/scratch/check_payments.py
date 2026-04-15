import psycopg2
from psycopg2.extras import RealDictCursor

def verify():
    try:
        conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/postgres")
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("--- Métodos de Pago en log_pago_facturas ---")
        cur.execute("SELECT metodo_pago, COUNT(*), SUM(monto) FROM sistema_facturacion.log_pago_facturas GROUP BY metodo_pago")
        print(cur.fetchall())
        
        print("\n--- Rango de Fechas en log_pago_facturas ---")
        cur.execute("SELECT MIN(fecha_pago), MAX(fecha_pago) FROM sistema_facturacion.log_pago_facturas")
        print(cur.fetchall())

        print("\n--- Ejemplo de registro con Join ---")
        cur.execute("""
            SELECT lp.id, lp.metodo_pago, lp.fecha_pago, f.estado 
            FROM sistema_facturacion.log_pago_facturas lp
            JOIN sistema_facturacion.facturas f ON lp.factura_id = f.id
            LIMIT 5
        """)
        print(cur.fetchall())
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
