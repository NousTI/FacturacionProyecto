import psycopg2
import os
import sys

# Cargar variables de entorno (simulado o real)
DB_HOST = "localhost"
DB_NAME = "sistema_facturacion"
DB_USER = "postgres"
DB_PASSWORD = "password"
DB_PORT = 5432

def inspect_columns():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        cur.execute("""
            SELECT column_name, ordinal_position, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'sistema_facturacion' AND table_name = 'facturas'
            ORDER BY ordinal_position;
        """)
        
        columns = cur.fetchall()
        for col in columns:
            print(f"{col[1]}: {col[0]} ({col[2]})")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_columns()
