import psycopg2
from src.config.env import env

def check_facturas_schema():
    print(f"Connecting to DB...")
    try:
        conn = psycopg2.connect(env.database_url)
        cur = conn.cursor()
        
        query = """
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'sistema_facturacion' 
            AND table_name = 'facturas'
            ORDER BY ordinal_position;
        """
        cur.execute(query)
        columns = cur.fetchall()
        
        print("\nColumnas en 'sistema_facturacion.facturas':")
        for col, dtype in columns:
            print(f"- {col}: {dtype}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_facturas_schema()
