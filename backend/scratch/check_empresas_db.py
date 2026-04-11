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

def main():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("\n=== Verificando tabla: empresas ===")
        
        # 1. Columnas y Tipos
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'sistema_facturacion' AND table_name = 'empresas';
        """)
        cols = cur.fetchall()
        for col in cols:
            print(f"  {col['column_name']}: {col['data_type']}")

        # 2. Valores actuales de tipo_contribuyente
        cur.execute("SELECT DISTINCT tipo_contribuyente FROM sistema_facturacion.empresas;")
        values = cur.fetchall()
        print("\n--- Valores actuales de tipo_contribuyente ---")
        for val in values:
            print(f"  - '{val['tipo_contribuyente']}'")

        # 3. Valores actuales de ruc (formato)
        cur.execute("SELECT ruc FROM sistema_facturacion.empresas LIMIT 5;")
        rucs = cur.fetchall()
        print("\n--- Muestra de RUCs ---")
        for r in rucs:
            print(f"  - {r['ruc']}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
