import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Try to find real env
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

import argparse

def check_table(cur, table_name, empresa_id=None):
    print(f"\n{'='*60}")
    print(f"=== TABLA: {table_name} ===")
    print(f"{'='*60}")
    
    # 1. Columnas (Omitido para brevedad si hay filtro, o mostrar siempre)
    # ... (mismo código) ...
    cur.execute(f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'sistema_facturacion' AND table_name = '{table_name}'
        ORDER BY ordinal_position;
    """)
    cols = cur.fetchall()
    
    # Check if empresa_id column exists
    has_empresa_id = any(c['column_name'] == 'empresa_id' for c in cols)

    # 3. Row Count
    where_clause = ""
    if empresa_id and has_empresa_id:
        where_clause = f"WHERE empresa_id = '{empresa_id}'"
    
    cur.execute(f"SELECT COUNT(*) as total FROM sistema_facturacion.{table_name} {where_clause};")
    count = cur.fetchone()['total']
    print(f"--- ESTADÍSTICAS ---")
    print(f"  Total de registros{' (filtrados)' if where_clause else ''}: {count}")

    # 4. Data Samples (top 5, ordered by date if possible)
    if count > 0:
        print(f"\n--- ÚLTIMOS REGISTROS ---")
        order_by = ""
        # Detect date columns for ordering
        date_cols = [c['column_name'] for c in cols if 'date' in c['data_type'] or 'timestamp' in c['data_type']]
        if 'created_at' in date_cols:
            order_by = "ORDER BY created_at DESC"
        elif date_cols:
            order_by = f"ORDER BY {date_cols[0]} DESC"

        cur.execute(f"SELECT * FROM sistema_facturacion.{table_name} {where_clause} {order_by} LIMIT 5;")
        samples = cur.fetchall()
        for i, row in enumerate(samples):
            print(f"  [Registro {i+1}]:")
            for k, v in row.items():
                print(f"    {k}: {v}")
    else:
        print("\n--- SIN DATOS ---")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--empresa", help="ID de la empresa a filtrar")
    args = parser.parse_args()

    conn = None
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
        
        # Primero listar todas las tablas del schema
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'sistema_facturacion'
            ORDER BY table_name;
        """)
        all_tables = [r['table_name'] for r in cur.fetchall()]
        print("\n" + "="*60)
        print("TABLAS DISPONIBLES EN schema sistema_facturacion:")
        print("="*60)
        for t in all_tables:
            print(f"  - {t}")

        # Luego mostrar columnas de las tablas clave para R-027
        tables_r027 = [
            "empresas",
            "facturas",
            "facturas_detalle",
            "gastos",
            "cuentas_cobrar",
        ]

        tables = tables_r027
        
        for table in tables:
            try:
                check_table(cur, table, args.empresa)
            except Exception as e:
                print(f"\nError al verificar tabla '{table}': {e}")
            
        conn.close()
    except Exception as e:
        print(f"Error de conexión: {str(e)}")

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()
