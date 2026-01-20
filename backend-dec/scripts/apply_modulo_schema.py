import sys
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from config import get_db_config

def apply_schema():
    config = get_db_config()
    conn = psycopg2.connect(**config)
    cursor = conn.cursor()
    
    sql = """
    -- =====================================================
    -- MÓDULO: MODULO
    -- =====================================================
    CREATE TABLE IF NOT EXISTS public.modulo (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        codigo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,

        icono TEXT,
        categoria TEXT,

        orden INTEGER NOT NULL DEFAULT 0 CHECK (orden >= 0),

        activo BOOLEAN NOT NULL DEFAULT TRUE,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT uq_modulo_codigo UNIQUE (codigo)
    );

    -- =====================================================
    -- MÓDULO: MODULO_PLAN
    -- =====================================================
    CREATE TABLE IF NOT EXISTS public.modulo_plan (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        plan_id UUID NOT NULL
            REFERENCES public.plan(id) ON DELETE CASCADE,

        modulo_id UUID NOT NULL
            REFERENCES public.modulo(id) ON DELETE CASCADE,

        incluido BOOLEAN NOT NULL DEFAULT TRUE,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT uq_modulo_plan
            UNIQUE (plan_id, modulo_id)
    );

    -- =====================================================
    -- MÓDULO: MODULO_EMPRESA
    -- =====================================================
    CREATE TABLE IF NOT EXISTS public.modulo_empresa (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        empresa_id UUID NOT NULL
            REFERENCES public.empresa(id) ON DELETE CASCADE,

        modulo_id UUID NOT NULL
            REFERENCES public.modulo(id) ON DELETE CASCADE,

        activo BOOLEAN NOT NULL DEFAULT TRUE,

        fecha_activacion DATE NOT NULL DEFAULT CURRENT_DATE,
        fecha_vencimiento DATE,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT uq_modulo_empresa
            UNIQUE (empresa_id, modulo_id)
    );
    """
    
    print("Applying schema...")
    cursor.execute(sql)
    conn.commit()
    print("Schema applied successfully.")
    conn.close()

if __name__ == "__main__":
    apply_schema()
