import sys
import os

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from src.database.session import get_db

def verify_revenue():
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        with db.cursor() as cur:
            # Check payments linked to users
            cur.execute("""
                SELECT 
                    v.nombres, 
                    v.apellidos,
                    SUM(ps.monto) as revenue,
                    COUNT(ps.id) as payment_count
                FROM vendedor v
                JOIN empresa e ON e.vendedor_id = v.id
                JOIN usuario u ON u.empresa_id = e.id
                JOIN pago_suscripcion ps ON ps.referencia_id = CAST(u.id AS TEXT) OR ps.referencia_id = u.id::text
                WHERE ps.estado IN ('PAGADO', 'COMPLETED')
                GROUP BY v.id, v.nombres, v.apellidos
            """)
            results = cur.fetchall()
            print("Revenue Verification (Path: Pago -> User -> Empresa -> Seller):")
            if not results:
                print("No payments found matching this path.")
            for r in results:
                print(f" - {r['nombres']} {r['apellidos']}: ${r['revenue']} ({r['payment_count']} payments)")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_revenue()
