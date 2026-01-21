import sys
import os

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from src.database.session import get_db

def check_structure():
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        with db.cursor() as cur:
            # Check table existance
            cur.execute("SELECT to_regclass('public.configuracion_sri')")
            if not cur.fetchone()[0]:
                print("Table 'configuracion_sri' DOES NOT EXIST")
                return

            print("Table 'configuracion_sri' FOUND")
            
            # Check columns
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'configuracion_sri'
            """)
            columns = [r['column_name'] for r in cur.fetchall()]
            print(f"Columns: {columns}")
            
            if 'fecha_expiracion_cert' in columns:
                print("Column 'fecha_expiracion_cert' FOUND")
            else:
                print("Column 'fecha_expiracion_cert' MISSING")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_structure()
