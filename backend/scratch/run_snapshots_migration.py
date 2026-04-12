import psycopg2
import os
import sys

# Asegurar que el path incluya src
sys.path.append(os.getcwd())
from src.config.env import env

def run_migration():
    sql_file = "migrations/add_factura_snapshots.sql"
    print(f"--- Iniciando migración de snapshots ---")
    print(f"Archivo: {sql_file}")
    
    try:
        # Leer el contenido del SQL
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_script = f.read()
            
        # Conectar a la DB
        conn = psycopg2.connect(env.database_url)
        cur = conn.cursor()
        
        # Ejecutar el script
        print("Ejecutando script SQL...")
        cur.execute(sql_script)
        
        conn.commit()
        print("¡Migración completada con éxito!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error durante la migración: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()

if __name__ == "__main__":
    run_migration()
