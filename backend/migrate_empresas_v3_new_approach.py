import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Importar configuración de base de datos
try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except ImportError:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password" 
        DB_PORT = 5432
    env = MockEnv()

def migrate():
    conn = None
    try:
        print("Iniciando migración de 'Empresas' al nuevo estándar de identificación...")
        
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT
        )
        conn.autocommit = False
        cur = conn.cursor()

        # 1. Añadir columna tipo_persona si no existe
        cur.execute("""
            SELECT count(*) FROM information_schema.columns 
            WHERE table_schema = 'sistema_facturacion' 
            AND table_name = 'empresas' 
            AND column_name = 'tipo_persona';
        """)
        if cur.fetchone()[0] == 0:
            print("  - Añadiendo columna 'tipo_persona'")
            cur.execute("ALTER TABLE sistema_facturacion.empresas ADD COLUMN tipo_persona TEXT;")
        
        # 2. Migrar datos existentes
        print("  - Migrando datos existentes (PERSONA_NATURAL -> NATURAL + REGIMEN_GENERAL)")
        cur.execute("""
            UPDATE sistema_facturacion.empresas 
            SET tipo_persona = 'NATURAL', 
                tipo_contribuyente = 'REGIMEN_GENERAL' 
            WHERE tipo_contribuyente = 'PERSONA_NATURAL' OR tipo_persona IS NULL;
        """)

        # 3. Aplicar NOT NULL
        print("  - Aplicando NOT NULL a ruc, tipo_persona y tipo_contribuyente")
        cur.execute("ALTER TABLE sistema_facturacion.empresas ALTER COLUMN ruc SET NOT NULL;")
        cur.execute("ALTER TABLE sistema_facturacion.empresas ALTER COLUMN tipo_persona SET NOT NULL;")
        cur.execute("ALTER TABLE sistema_facturacion.empresas ALTER COLUMN tipo_contribuyente SET NOT NULL;")

        # 4. Aplicar CHECK constraints
        print("  - Actualizando restricciones CHECK")
        
        # tipo_persona
        cur.execute("ALTER TABLE sistema_facturacion.empresas DROP CONSTRAINT IF EXISTS empresas_tipo_persona_check;")
        cur.execute("ALTER TABLE sistema_facturacion.empresas ADD CONSTRAINT empresas_tipo_persona_check CHECK (tipo_persona IN ('NATURAL', 'JURIDICA'));")
        
        # tipo_contribuyente
        cur.execute("ALTER TABLE sistema_facturacion.empresas DROP CONSTRAINT IF EXISTS tipo_contribuyente_check;")
        cur.execute("ALTER TABLE sistema_facturacion.empresas DROP CONSTRAINT IF EXISTS empresas_tipo_contribuyente_check;")
        cur.execute("""
            ALTER TABLE sistema_facturacion.empresas 
            ADD CONSTRAINT empresas_tipo_contribuyente_check 
            CHECK (tipo_contribuyente IN ('REGIMEN_GENERAL', 'RIMPE_EMPRENDEDOR', 'RIMPE_POPULAR'));
        """)

        # ruc format
        cur.execute("ALTER TABLE sistema_facturacion.empresas DROP CONSTRAINT IF EXISTS ruc_format_check;")
        cur.execute("ALTER TABLE sistema_facturacion.empresas ADD CONSTRAINT ruc_format_check CHECK (ruc ~ '^[0-9]{10}001$');")

        conn.commit()
        print("\n¡Migración de Empresas completada con éxito!")

    except Exception as e:
        if conn: conn.rollback()
        print(f"\nERROR DURANTE LA MIGRACIÓN: {e}")
        sys.exit(1)
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    migrate()
