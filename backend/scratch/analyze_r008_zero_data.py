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

def main():
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
        
        print("\n=== ANALIZANDO ESTADOS DE FACTURAS ===")
        cur.execute("SELECT estado, COUNT(*) as count FROM sistema_facturacion.facturas GROUP BY estado;")
        for row in cur.fetchall():
            print(f"Estado: {row['estado']}, Cantidad: {row['count']}")

        print("\n=== ANALIZANDO CUENTAS POR COBRAR ===")
        cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.cuentas_cobrar WHERE saldo_pendiente > 0;")
        print(f"Cuentas con saldo pendiente > 0: {cur.fetchone()['count']}")

        print("\n=== ANALIZANDO RELACIÓN FACTURA - CUENTA COBRAR ===")
        cur.execute("""
            SELECT f.estado, COUNT(cc.id) as count
            FROM sistema_facturacion.facturas f
            JOIN sistema_facturacion.cuentas_cobrar cc ON f.id = cc.factura_id
            WHERE cc.saldo_pendiente > 0
            GROUP BY f.estado;
        """)
        for row in cur.fetchall():
            print(f"Estado Factura: {row['estado']}, Cuentas vinculadas: {row['count']}")

        print("\n=== MUESTRA DE FACTURAS (Últimas 5) ===")
        cur.execute("SELECT id, estado, total, fecha_emision FROM sistema_facturacion.facturas ORDER BY created_at DESC LIMIT 5;")
        for row in cur.fetchall():
            print(row)

        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
