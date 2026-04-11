import psycopg2
from psycopg2 import sql
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
        print("Iniciando migración de base de datos a estándares SRI...")
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT
        )
        conn.autocommit = False
        cur = conn.cursor()

        # 1. MÓDULO VENDEDORES
        print("\n--- Procesando tabla: vendedores ---")
        
        # Renombrar columna si existe con el nombre antiguo
        cur.execute("""
            SELECT count(*) FROM information_schema.columns 
            WHERE table_schema = 'sistema_facturacion' 
            AND table_name = 'vendedores' 
            AND column_name = 'documento_identidad';
        """)
        if cur.fetchone()[0] > 0:
            print("  - Renombrando 'documento_identidad' a 'identificacion'")
            cur.execute("ALTER TABLE sistema_facturacion.vendedores RENAME COLUMN documento_identidad TO identificacion;")
        
        # Asegurar NOT NULL
        print("  - Aplicando NOT NULL")
        cur.execute("ALTER TABLE sistema_facturacion.vendedores ALTER COLUMN identificacion SET NOT NULL;")
        
        # Migrar datos de tipo_identificacion
        print("  - Migrando valores de tipo_identificacion")
        mapping = {"CEDULA": "05", "RUC": "04", "PASAPORTE": "06"}
        for old, new in mapping.items():
            cur.execute(
                "UPDATE sistema_facturacion.vendedores SET tipo_identificacion = %s WHERE tipo_identificacion = %s;",
                (new, old)
            )
        
        # Agregar DEFAULT y NOT NULL a tipo_identificacion
        cur.execute("ALTER TABLE sistema_facturacion.vendedores ALTER COLUMN tipo_identificacion SET DEFAULT '05';")
        cur.execute("ALTER TABLE sistema_facturacion.vendedores ALTER COLUMN tipo_identificacion SET NOT NULL;")

        # Agregar UNIQUE constraint
        cur.execute("""
            SELECT count(*) FROM pg_constraint 
            WHERE conname = 'uq_vendedor_identificacion';
        """)
        if cur.fetchone()[0] == 0:
            print("  - Agregando restricción UNIQUE a identificacion")
            cur.execute("ALTER TABLE sistema_facturacion.vendedores ADD CONSTRAINT uq_vendedor_identificacion UNIQUE (identificacion);")

        # Agregar CHECK constraint
        cur.execute("ALTER TABLE sistema_facturacion.vendedores DROP CONSTRAINT IF EXISTS vendedores_tipo_identificacion_check;")
        cur.execute("""
            ALTER TABLE sistema_facturacion.vendedores 
            ADD CONSTRAINT vendedores_tipo_identificacion_check 
            CHECK (tipo_identificacion IN ('04', '05', '06', '07', '08'));
        """)


        # 2. MÓDULO CLIENTES Y PROVEEDORES
        for table in ["clientes", "proveedores"]:
            print(f"\n--- Procesando tabla: {table} ---")
            
            # Limpiar check constraints antiguos (pueden tener nombres variables)
            print(f"  - Eliminando restricciones antiguas en {table}")
            cur.execute(f"""
                SELECT conname FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE n.nspname = 'sistema_facturacion' 
                AND conrelid = 'sistema_facturacion.{table}'::regclass
                AND conname LIKE '%tipo_identificacion_check%';
            """)
            checks = cur.fetchall()
            for check in checks:
                cur.execute(f"ALTER TABLE sistema_facturacion.{table} DROP CONSTRAINT {check[0]};")
            
            # Migrar datos
            print(f"  - Migrando valores de tipo_identificacion en {table}")
            for old, new in mapping.items():
                cur.execute(
                    f"UPDATE sistema_facturacion.{table} SET tipo_identificacion = %s WHERE tipo_identificacion = %s;",
                    (new, old)
                )
            
            # Agregar nuevo CHECK constraint
            print(f"  - Agregando nuevo CHECK constraint SRI a {table}")
            cur.execute(f"""
                ALTER TABLE sistema_facturacion.{table} 
                ADD CONSTRAINT {table}_tipo_identificacion_check 
                CHECK (tipo_identificacion IN ('04', '05', '06', '07', '08'));
            """)

        conn.commit()
        print("\n¡Migración completada con éxito!")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"\nERROR DURANTE LA MIGRACIÓN: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate()
