import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Importar configuración de base de datos de la misma forma que en scripts exitosos
try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except ImportError:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password"  # Fallback a 'password' que es lo que dice el .env a veces
        DB_PORT = 5432
    env = MockEnv()

def migrate():
    conn = None
    try:
        print("Iniciando aplicación de validaciones en tabla empresas (usando configuración de env)...")
        
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Verificar si hay RUCs nulos
        cur.execute("SELECT count(*) FROM sistema_facturacion.empresas WHERE ruc IS NULL;")
        null_rucs = cur.fetchone()['count']
        if null_rucs > 0:
            print(f"ERROR: Hay {null_rucs} empresas sin RUC. No se puede aplicar NOT NULL.")
            return

        # 2. Verificar formato de RUC
        # Regex: 13 dígitos, empezando con 0,1,2 (provincias) y terminando en 001
        cur.execute("SELECT ruc FROM sistema_facturacion.empresas WHERE ruc !~ '^[0-9]{10}001$';")
        invalid_rucs = cur.fetchall()
        if invalid_rucs:
            print(f"ERROR: Hay RUCs con formato inválido en la base de datos: {[r['ruc'] for r in invalid_rucs]}")
            return

        # 3. Verificar tipo_contribuyente
        allowed_types = ['REGIMEN_GENERAL', 'RIMPE_EMPRENDEDOR', 'RIMPE_POPULAR', 'CONTRIBUYENTE_ESPECIAL']
        cur.execute("SELECT DISTINCT tipo_contribuyente FROM sistema_facturacion.empresas;")
        current_types = [r['tipo_contribuyente'] for r in cur.fetchall()]
        invalid_types = [t for t in current_types if t not in allowed_types]
        if invalid_types:
            print(f"ERROR: Hay tipos de contribuyente inválidos en la base de datos: {invalid_types}")
            return

        # SI TODO ESTÁ BIEN, APLICAMOS LOS CAMBIOS
        print("Aplicando restricciones en la base de datos...")
        
        # Aplicar NOT NULL
        cur.execute("ALTER TABLE sistema_facturacion.empresas ALTER COLUMN ruc SET NOT NULL;")
        
        # Eliminar si ya existen para evitar errores al re-ejecutar
        cur.execute("ALTER TABLE sistema_facturacion.empresas DROP CONSTRAINT IF EXISTS ruc_format_check;")
        cur.execute("ALTER TABLE sistema_facturacion.empresas ADD CONSTRAINT ruc_format_check CHECK (ruc ~ '^[0-9]{10}001$');")
        
        cur.execute("ALTER TABLE sistema_facturacion.empresas DROP CONSTRAINT IF EXISTS tipo_contribuyente_check;")
        cur.execute("""
            ALTER TABLE sistema_facturacion.empresas 
            ADD CONSTRAINT tipo_contribuyente_check 
            CHECK (tipo_contribuyente IN ('REGIMEN_GENERAL', 'RIMPE_EMPRENDEDOR', 'RIMPE_POPULAR', 'CONTRIBUYENTE_ESPECIAL'));
        """)
        
        conn.commit()
        print("¡Éxito! Validaciones aplicadas correctamente en la base de datos.")

    except Exception as e:
        if conn: conn.rollback()
        # Evitar problemas de encoding en la consola
        msg = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"Error durante la migración: {msg}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    migrate()
