import psycopg2
import os
import sys

# Cargar variables de entorno
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

def apply_db_fix():
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
        
        print("\n=== APLICANDO CORRECCIÓN DE CÁLCULO SRI EN BASE DE DATOS ===")
        
        sql = """
        -- 1. Eliminar restricciones obsoletas e incompletas
        ALTER TABLE sistema_facturacion.facturas 
        DROP CONSTRAINT IF EXISTS facturas_total_check_v2,
        DROP CONSTRAINT IF EXISTS chk_facturas_total_calculado;

        -- 2. Crear nueva restricción integral con todos los campos SRI
        ALTER TABLE sistema_facturacion.facturas
        ADD CONSTRAINT facturas_total_check_sri
        CHECK (
            total = ROUND(
                (subtotal_sin_iva + 
                 subtotal_con_iva + 
                 subtotal_no_objeto_iva + 
                 subtotal_exento_iva + 
                 iva + 
                 ice + 
                 propina) - 
                (descuento + 
                 retencion_iva + 
                 retencion_renta), 
            2)
        );
        """
        
        cur.execute(sql)
        print("  [OK] Restricciones obsoletas eliminadas.")
        print("  [OK] Nueva restricción 'facturas_total_check_sri' creada con éxito.")

        conn.close()
    except Exception as e:
        print(f"Error al aplicar la migración: {str(e)}")

if __name__ == "__main__":
    apply_db_fix()
