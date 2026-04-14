import psycopg2
import os

DB_HOST = "localhost"
DB_NAME = "sistema_facturacion"
DB_USER = "postgres"
DB_PASSWORD = "password"
DB_PORT = 5432

def get_constraint_def():
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
            SELECT pg_get_constraintdef(oid) 
            FROM pg_constraint 
            WHERE conname = 'facturas_total_check_sri';
        """)
        
        res = cur.fetchone()
        if res:
            print(res[0])
        else:
            print("Constraint not found")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_constraint_def()
