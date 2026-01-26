import os
import sys

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from src.database.session import get_db_connection_raw

def verify_fix():
    print("Connecting to DB...")
    conn = get_db_connection_raw()
    try:
        with conn.cursor() as cur:
            # This is the updated logic from repository.py
            query = """
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE activo = true) as activos,
                    COUNT(*) FILTER (WHERE activo = false) as inactivos,
                    (SELECT COUNT(*) FROM empresa) as empresas_totales,
                    COALESCE((
                        SELECT SUM(ps.monto)
                        FROM pago_suscripcion ps
                        JOIN empresa e ON ps.empresa_id = e.id
                        WHERE ps.estado IN ('PAGADO', 'COMPLETED')
                        AND e.vendedor_id IS NOT NULL
                    ), 0) as ingresos_generados
                FROM vendedor
            """
            cur.execute(query)
            result = cur.fetchone()
            stats = dict(result)
            print(f"Stats Result: {stats}")
            
            if stats['ingresos_generados'] > 0:
                print("SUCCESS: Revenue is now correctly calculated!")
            else:
                print("FAILURE: Revenue is still 0.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    verify_fix()
