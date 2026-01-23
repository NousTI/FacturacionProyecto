import sys
import os

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from src.database.session import get_db

def verify_data():
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        with db.cursor() as cur:
            # Check sellers
            cur.execute("SELECT id, nombres, apellidos FROM vendedor LIMIT 5")
            vendedores = cur.fetchall()
            print("Sellers sample:")
            for v in vendedores:
                print(f" - {v['id']}: {v['nombres']} {v['apellidos']}")
            
            # Check companies per seller
            cur.execute("""
                SELECT v.nombres, v.apellidos, COUNT(e.id) as count
                FROM vendedor v
                LEFT JOIN empresa e ON e.vendedor_id = v.id
                GROUP BY v.id, v.nombres, v.apellidos
            """)
            counts = cur.fetchall()
            print("\nCompanies per Seller:")
            for c in counts:
                print(f" - {c['nombres']} {c['apellidos']}: {c['count']}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_data()
