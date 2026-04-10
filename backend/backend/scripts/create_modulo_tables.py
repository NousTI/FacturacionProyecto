"""
Script para crear las tablas de módulos en el schema correcto (sistema_facturacion)
"""
import psycopg2
from pathlib import Path

# Read .env from parent directory
env_file = Path(__file__).resolve().parent.parent / '.env'

def read_env(path):
    """Simple .env reader"""
    env = {}
    if path.exists():
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env[key.strip()] = value.strip()
    return env

def create_modulo_tables():
    """Create modulo-related tables in sistema_facturacion schema"""

    print(f"Reading env from: {env_file}")
    env = read_env(env_file)

    print(f"ENV keys loaded: {list(env.keys())}")

    db_host = env.get('DB_HOST', 'localhost')
    db_port = int(env.get('DB_PORT', 5432))
    db_name = env.get('DB_NAME', 'sistema_facturacion')
    db_user = env.get('DB_USER', 'postgres')
    db_password = env.get('DB_PASSWORD')

    print(f"DB Config - Host: {db_host}, Port: {db_port}, Name: {db_name}, User: {db_user}, Password: {'***' if db_password else 'EMPTY'}")

    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        database=db_name,
        user=db_user,
        password=db_password
    )
    cur = conn.cursor()

    sql = """
    -- =====================================================
    -- TABLA: modulo
    -- =====================================================
    CREATE TABLE IF NOT EXISTS sistema_facturacion.modulo (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        codigo TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        icono TEXT,
        categoria TEXT,
        orden INTEGER NOT NULL DEFAULT 0 CHECK (orden >= 0),
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- =====================================================
    -- TABLA: modulo_plan
    -- =====================================================
    CREATE TABLE IF NOT EXISTS sistema_facturacion.modulo_plan (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES sistema_facturacion.planes(id) ON DELETE CASCADE,
        modulo_id UUID NOT NULL REFERENCES sistema_facturacion.modulo(id) ON DELETE CASCADE,
        incluido BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_modulo_plan UNIQUE (plan_id, modulo_id)
    );

    -- =====================================================
    -- TABLA: modulo_empresa
    -- =====================================================
    CREATE TABLE IF NOT EXISTS sistema_facturacion.modulo_empresa (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,
        modulo_id UUID NOT NULL REFERENCES sistema_facturacion.modulo(id) ON DELETE CASCADE,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        fecha_activacion DATE NOT NULL DEFAULT CURRENT_DATE,
        fecha_vencimiento DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_modulo_empresa UNIQUE (empresa_id, modulo_id)
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_modulo_plan_plan_id ON sistema_facturacion.modulo_plan(plan_id);
    CREATE INDEX IF NOT EXISTS idx_modulo_plan_modulo_id ON sistema_facturacion.modulo_plan(modulo_id);
    CREATE INDEX IF NOT EXISTS idx_modulo_empresa_empresa_id ON sistema_facturacion.modulo_empresa(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_modulo_empresa_modulo_id ON sistema_facturacion.modulo_empresa(modulo_id);
    """

    try:
        print("Creating modulo-related tables in sistema_facturacion schema...")
        cur.execute(sql)
        conn.commit()
        print("✓ Tables created successfully!")

        # Verify tables were created
        cur.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'sistema_facturacion'
            AND table_name IN ('modulo', 'modulo_plan', 'modulo_empresa')
            ORDER BY table_name
        """)
        created_tables = [row[0] for row in cur.fetchall()]
        print(f"✓ Verified tables: {', '.join(created_tables)}")

    except Exception as e:
        print(f"✗ Error creating tables: {str(e)}")
        conn.rollback()
        exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    create_modulo_tables()
