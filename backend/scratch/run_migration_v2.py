import psycopg2
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

def run_migration():
    sql_file = "backend/migrations/migrate_v2_sequentials.sql"
    if not os.path.exists(sql_file):
        print(f"Error: {sql_file} not found.")
        return

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql = f.read()

    conn = None
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT
        )
        cur = conn.cursor()
        print(f"Ejecutando migración desde {sql_file}...")
        cur.execute(sql)
        conn.commit()
        print("Migración completada exitosamente.")
        cur.close()
        conn.close()
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error durante la migración: {e}")

if __name__ == "__main__":
    run_migration()
