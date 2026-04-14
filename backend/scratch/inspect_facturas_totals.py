import psycopg2
from psycopg2.extras import RealDictCursor
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

def inspect_facturas():
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
        
        print("\n=== ESTRUCTURA DE LA TABLA: sistema_facturacion.facturas ===")
        
        # 1. Obtener columnas y comentarios
        cur.execute("""
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                (SELECT pg_catalog.col_description(c.oid, cols.ordinal_position::int)
                 FROM pg_catalog.pg_class c
                 WHERE c.oid = (SELECT ('sistema_facturacion.facturas')::regclass)
                 AND c.relname = 'facturas') as description
            FROM information_schema.columns cols
            WHERE table_schema = 'sistema_facturacion' AND table_name = 'facturas'
            ORDER BY ordinal_position;
        """)
        columns = cur.fetchall()
        for col in columns:
            desc = f" -- {col['description']}" if col['description'] else ""
            print(f"  {col['column_name']} ({col['data_type']}){desc}")

        # 2. Obtener restricciones (CHECK constraints)
        print("\n=== RESTRICCIONES DE CÁLCULO (CONTROLES DE INTEGRIDAD) ===")
        cur.execute("""
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'sistema_facturacion.facturas'::regclass
            AND contype = 'c';
        """)
        constraints = cur.fetchall()
        for con in constraints:
            print(f"  [{con['conname']}]: {con['definition']}")

        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    inspect_facturas()
