import sys
import os

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from src.database.session import get_db

def inspect_schema():
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        with db.cursor() as cur:
            # Inspection of pago_suscripcion
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'pago_suscripcion'
            """)
            rows = cur.fetchall()
            print("pago_suscripcion columns:")
            for r in rows:
                print(f" - {r['column_name']}: {r['data_type']}")
            
            # Inspection of usuario
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'usuario'
            """)
            rows = cur.fetchall()
            print("\nusuario columns:")
            for r in rows:
                print(f" - {r['column_name']}: {r['data_type']}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_schema()
