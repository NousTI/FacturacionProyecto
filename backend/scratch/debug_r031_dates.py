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

def main():
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
        
        print("=== SUSCRIPCIONES ACTIVAS ===")
        cur.execute("SELECT empresa_id, estado, fecha_inicio, fecha_fin FROM sistema_facturacion.suscripciones WHERE estado = 'ACTIVA';")
        rows = cur.fetchall()
        for r in rows:
            print(r)
            
        print("\n=== FILTROS ACTUALES DEL REPORTE (Aproximación) ===")
        # Supongamos que ff_use es hoy
        from datetime import date
        today = date.today().isoformat()
        print(f"ff_use estimado: {today}")
        
        cur.execute(f"SELECT COUNT(*) FROM sistema_facturacion.suscripciones WHERE estado = 'ACTIVA' AND fecha_inicio <= '{today}' AND (fecha_fin IS NULL OR fecha_fin >= '{today}');")
        count = cur.fetchone()['count']
        print(f"Conteo con filtro de tiempo (ff_use): {count}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
