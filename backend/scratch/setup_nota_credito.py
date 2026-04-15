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

def setup_nota_credito():
    sql_path = os.path.join(
        "db_sistema_facturacion", "sistema_facturacion", "facturacion", 
        "nota_credito", "nota_credito.sql"
    )
    
    if not os.path.exists(sql_path):
        print(f"Error: No se encontró el archivo SQL en {sql_path}")
        return

    print(f"--- Iniciando creación de tablas para Notas de Crédito ---")
    print(f"Conectando a: {env.DB_NAME} en {env.DB_HOST}...")

    conn = None
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print(f"Ejecutando script SQL...")
        cur.execute(sql_content)
        
        print("\n[OK] Tablas de Notas de Crédito creadas o verificadas exitosamente.")
        
        # Verificación rápida
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'sistema_facturacion' 
              AND table_name IN ('notas_credito', 'notas_credito_detalle', 'log_emision_notas_credito', 'autorizaciones_sri_notas_credito');
        """)
        tables = cur.fetchall()
        print(f"Tablas encontradas en el schema: {[t[0] for t in tables]}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"\n[ERROR] Falló la creación de las tablas: {str(e)}")
        if conn:
            conn.close()

if __name__ == "__main__":
    setup_nota_credito()
