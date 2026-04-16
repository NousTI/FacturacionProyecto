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
    
    print("1. Migrando registros Legacy a Códigos Oficiales SRI...")
    cur.execute("UPDATE sistema_facturacion.pago_gasto SET metodo_pago = '01' WHERE metodo_pago = 'efectivo';")
    cur.execute("UPDATE sistema_facturacion.pago_gasto SET metodo_pago = '19' WHERE metodo_pago = 'tarjeta';")
    cur.execute("UPDATE sistema_facturacion.pago_gasto SET metodo_pago = '20' WHERE metodo_pago = 'transferencia';")
    cur.execute("UPDATE sistema_facturacion.pago_gasto SET metodo_pago = '20' WHERE metodo_pago = 'cheque';")
    print(f"Líneas actualizadas exitosamente.")
    
    print("2. Destruyendo el constraint ambiguo...")
    cur.execute("ALTER TABLE sistema_facturacion.pago_gasto DROP CONSTRAINT IF EXISTS pago_gasto_metodo_pago_check;")
    
    print("3. Construyendo el nuevo constraint PÚRAMENTE paramétrico SRI...")
    new_constraint = """
    ALTER TABLE sistema_facturacion.pago_gasto 
    ADD CONSTRAINT pago_gasto_metodo_pago_check 
    CHECK (metodo_pago IN ('01', '15', '16', '17', '18', '19', '20', '21'));
    """
    cur.execute(new_constraint)
    
    print("Limpieza Histórica completada con éxito. La BD ahora es estrictamente Tipada para Pagos.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
