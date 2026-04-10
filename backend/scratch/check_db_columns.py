import psycopg2
import os

def check_columns():
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="sistema_facturacion",
        user="postgres",
        password="password"
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'sistema_facturacion' 
        AND table_name = 'productos'
    """)
    columns = [row[0] for row in cur.fetchall()]
    print("Columns in productos table:", columns)
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_columns()
