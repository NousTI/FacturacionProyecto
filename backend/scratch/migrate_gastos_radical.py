import psycopg2
import sys
import os

# Asegurar que el path incluya la raíz para importar src
sys.path.append(os.getcwd())

try:
    from src.config.env import env
except ImportError:
    print("Error: No se pudo importar src.config.env. Asegúrate de ejecutar desde la raíz del backend.")
    sys.exit(1)

def migrate():
    conn = None
    try:
        print(f"Conectando a {env.DB_NAME} en {env.DB_HOST}...")
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT
        )
        cur = conn.cursor()
        
        print("Ejecutando migración radical de gastos...")
        
        # Eliminar las columnas de monto (iva y monto_iva si existe de intentos previos)
        cur.execute("ALTER TABLE sistema_facturacion.gastos DROP COLUMN IF EXISTS iva CASCADE;")
        cur.execute("ALTER TABLE sistema_facturacion.gastos DROP COLUMN IF EXISTS monto_iva CASCADE;")
        
        # Asegurar que existe tipo_iva
        cur.execute("ALTER TABLE sistema_facturacion.gastos ADD COLUMN IF NOT EXISTS tipo_iva TEXT NOT NULL DEFAULT '2';")
        
        conn.commit()
        print("MIGRACIÓN EXITOSA: Columnas de monto eliminadas, tipo_iva presente.")
        
    except Exception as e:
        print(f"ERROR DURANTE LA MIGRACIÓN: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate()
