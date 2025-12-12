import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection

def  verify_permissions():
    gen = get_db_connection()
    try:
        conn = next(gen)
    except StopIteration:
        print("Failed to connect")
        return

    with conn.cursor() as cur:
        print("\n--- CONSULTANDO ROL_PERMISO PARA ROL ID 1 ---")
        cur.execute("SELECT * FROM ROL_PERMISO WHERE FK_ROL = 1")
        rows = cur.fetchall()
        
        if not rows:
            print("No se encontraron filas.")
        else:
            print(f"Se encontraron {len(rows)} permisos asignados:")
            for row in rows:
                print(row)

    conn.close()

if __name__ == "__main__":
    verify_permissions()
