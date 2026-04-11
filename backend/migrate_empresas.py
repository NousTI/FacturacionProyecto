import psycopg2
from psycopg2.extras import RealDictCursor
import sys

# Connection details from .env
DB_CONFIG = {
    "host": "localhost",
    "database": "sistema_facturacion",
    "user": "postgres",
    "password": "admin",
    "port": "5432"
}

def migrate():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("Iniciando aplicación de validaciones en tabla empresas...")

        # 1. Verificar si hay RUCs nulos
        cur.execute("SELECT count(*) FROM sistema_facturacion.empresas WHERE ruc IS NULL;")
        null_rucs = cur.fetchone()['count']
        if null_rucs > 0:
            print(f"ERROR: Hay {null_rucs} empresas sin RUC. No se puede aplicar NOT NULL.")
            return

        # 2. Verificar formato de RUC
        cur.execute("SELECT ruc FROM sistema_facturacion.empresas WHERE ruc !~ '^[0-9]{10}001$';")
        invalid_rucs = cur.fetchall()
        if invalid_rucs:
            print(f"ERROR: Hay RUCs con formato inválido: {[r['ruc'] for r in invalid_rucs]}")
            return

        # 3. Verificar tipo_contribuyente
        allowed_types = ['REGIMEN_GENERAL', 'RIMPE_EMPRENDEDOR', 'RIMPE_POPULAR', 'CONTRIBUYENTE_ESPECIAL']
        cur.execute("SELECT DISTINCT tipo_contribuyente FROM sistema_facturacion.empresas;")
        current_types = [r['tipo_contribuyente'] for r in cur.fetchall()]
        invalid_types = [t for t in current_types if t not in allowed_types]
        if invalid_types:
            print(f"ERROR: Hay tipos de contribuyente inválidos: {invalid_types}")
            return

        # SI TODO ESTÁ BIEN, APLICAMOS LOS CAMBIOS
        print("Aplicando restricciones en la base de datos...")
        
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
        # Avoid encoding issues in print
        msg = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"Error durante la migración: {msg}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    migrate()
