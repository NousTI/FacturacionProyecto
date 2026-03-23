
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from decimal import Decimal

# Custom JSON encoder for Decimal
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

connection_url = "postgresql://postgres:admin@localhost:5432/sistema_facturacion"

def check_db():
    try:
        conn = psycopg2.connect(connection_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Total Invoices and their join with counts
        cur.execute("""
            SELECT 
                f.id, 
                f.numero_factura, 
                f.total, 
                f.estado, 
                f.estado_pago,
                cc.saldo_pendiente
            FROM sistema_facturacion.facturas f
            LEFT JOIN sistema_facturacion.cuentas_cobrar cc ON f.id = cc.factura_id
            WHERE f.estado = 'AUTORIZADA'
            LIMIT 10
        """)
        facturas = cur.fetchall()
        
        # 2. Count invoices without record in cuentas_cobrar
        cur.execute("""
            SELECT COUNT(*) as sin_cuenta
            FROM sistema_facturacion.facturas f
            LEFT JOIN sistema_facturacion.cuentas_cobrar cc ON f.id = cc.factura_id
            WHERE cc.id IS NULL
        """)
        sin_cuenta = cur.fetchone()['sin_cuenta']
        
        output = {
            "facturas_sample": facturas,
            "sin_cuenta_cobrar": sin_cuenta
        }
        
        with open("db_investigation.json", "w", encoding="utf-8") as f:
            json.dump(output, f, cls=DecimalEncoder, indent=2, default=str)
            
        cur.close()
        conn.close()
    except Exception as e:
        with open("db_error.txt", "w", encoding="utf-8") as f:
            f.write(str(e))

if __name__ == "__main__":
    check_db()
