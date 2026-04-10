
import psycopg2
from psycopg2.extras import RealDictCursor

def check_schema():
    conn = psycopg2.connect("dbname=facturacion_db user=postgres password=postgres host=localhost")
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check columns of pagos_suscripciones
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'sistema_facturacion' AND table_name = 'pagos_suscripciones'")
        columns = [row['column_name'] for row in cur.fetchall()]
        print(f"Columns in pagos_suscripciones: {columns}")
        
        # Check some data to see if there's any 'motivo' or 'tipo' that I missed
        cur.execute("SELECT * FROM sistema_facturacion.pagos_suscripciones LIMIT 5")
        rows = cur.fetchall()
        print(f"Sample data: {rows}")
    conn.close()

if __name__ == "__main__":
    check_schema()
