import sys
import os
import json

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from src.database.session import get_db

def check_planes():
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        with db.cursor() as cur:
            cur.execute("SELECT id, codigo, nombre, caracteristicas FROM plan")
            rows = cur.fetchall()
            print(f"Total planes found: {len(rows)}")
            for row in rows:
                print(f"Plan: {row['nombre']}")
                print(f"Caracteristicas ({type(row['caracteristicas'])}): {row['caracteristicas']}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_planes()
