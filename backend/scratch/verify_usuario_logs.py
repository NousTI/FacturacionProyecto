import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

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

def main():
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

        print("\n" + "="*60)
        print("=== TABLA: usuario_creacion_logs ===")
        print("="*60)

        # 1. Columnas
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'sistema_facturacion' AND table_name = 'usuario_creacion_logs'
            ORDER BY ordinal_position;
        """)
        cols = cur.fetchall()
        print("\n--- COLUMNAS ---")
        for c in cols:
            print(f"  {c['column_name']} | {c['data_type']} | nullable={c['is_nullable']} | default={c['column_default']}")

        # 2. CHECK constraints
        print("\n--- CHECK CONSTRAINTS ---")
        cur.execute("""
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'sistema_facturacion.usuario_creacion_logs'::regclass
              AND contype = 'c';
        """)
        checks = cur.fetchall()
        if checks:
            for c in checks:
                print(f"  {c['conname']}: {c['definition']}")
        else:
            print("  (sin CHECK constraints)")

        # 3. Valores distintos del campo origen
        print("\n--- VALORES DISTINTOS EN 'origen' ---")
        cur.execute("""
            SELECT origen, COUNT(*) as total
            FROM sistema_facturacion.usuario_creacion_logs
            GROUP BY origen
            ORDER BY total DESC;
        """)
        origenes = cur.fetchall()
        if origenes:
            for o in origenes:
                print(f"  origen='{o['origen']}' -> {o['total']} registros")
        else:
            print("  (tabla vacía)")

        # 4. Últimos 5 registros
        print("\n--- ÚLTIMOS 5 REGISTROS ---")
        cur.execute("""
            SELECT l.*, u.nombres, u.apellidos
            FROM sistema_facturacion.usuario_creacion_logs l
            LEFT JOIN sistema_facturacion.usuarios u ON u.id = l.usuario_id
            ORDER BY l.created_at DESC
            LIMIT 5;
        """)
        rows = cur.fetchall()
        if rows:
            for i, row in enumerate(rows):
                print(f"\n  [Registro {i+1}]:")
                for k, v in row.items():
                    print(f"    {k}: {v}")
        else:
            print("  (sin datos)")

        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
