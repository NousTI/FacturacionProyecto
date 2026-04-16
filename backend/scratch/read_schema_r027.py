import psycopg2
from psycopg2.extras import RealDictCursor
import sys
import os

try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
    from src.config.env import env
except:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password"
        DB_PORT = 5432
    env = MockEnv()


def read_columns(cur, table_name):
    cur.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'sistema_facturacion' AND table_name = %s
        ORDER BY ordinal_position;
    """, (table_name,))
    return cur.fetchall()


def main():
    conn = psycopg2.connect(
        host=env.DB_HOST,
        database=env.DB_NAME,
        user=env.DB_USER,
        password=env.DB_PASSWORD,
        port=env.DB_PORT,
        cursor_factory=RealDictCursor
    )
    cur = conn.cursor()

    # 1. Listar todas las tablas del schema
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'sistema_facturacion'
        ORDER BY table_name;
    """)
    all_tables = [r['table_name'] for r in cur.fetchall()]

    print("\n" + "="*60)
    print("TABLAS en schema sistema_facturacion:")
    print("="*60)
    for t in all_tables:
        print(f"  - {t}")

    # 2. Columnas de cada tabla
    for table in all_tables:
        cols = read_columns(cur, table)
        print(f"\n{'='*60}")
        print(f"TABLA: {table}")
        print(f"{'='*60}")
        for c in cols:
            nullable = "NULL" if c['is_nullable'] == 'YES' else "NOT NULL"
            print(f"  {c['column_name']:<35} {c['data_type']:<25} {nullable}")

    conn.close()


if __name__ == "__main__":
    main()
