import psycopg2
from psycopg2.extras import RealDictCursor

def verify_tables():
    try:
        conn = psycopg2.connect(
            host='localhost',
            dbname='sistema_facturacion',
            user='postgres',
            password='password',
            port=5432,
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        # Consultar si existe la tabla específica
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'sistema_facturacion' 
                AND table_name = 'log_pago_facturas'
            ) as existe;
        """)
        existe = cur.fetchone()['existe']
        
        print("\n" + "="*50)
        print(f"¿Existe la tabla 'log_pago_facturas'?: {'SÍ' if existe else 'NO (Eliminada)'}")
        print("="*50)
        
        # Listar todas las tablas actuales para confirmación visual
        print("\nTablas actuales en el esquema 'sistema_facturacion':")
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'sistema_facturacion' 
            ORDER BY table_name;
        """)
        for i, row in enumerate(cur.fetchall()):
            print(f"  {i+1}. {row['table_name']}")
            
        print("\n" + "="*50)
        conn.close()
    except Exception as e:
        print(f"Error al verificar: {e}")

if __name__ == "__main__":
    verify_tables()
