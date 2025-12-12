import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection

def check_roles():
    gen = get_db_connection()
    try:
        conn = next(gen)
    except StopIteration:
        print("Failed to connect")
        return

    with conn.cursor() as cur:
        # 1. Show all Roles
        print("\n--- ROLES ---")
        cur.execute("SELECT * FROM ROL")
        roles = cur.fetchall()
        for r in roles:
            print(r)

        # 2. Show Users and their Role IDs
        print("\n--- USERS ---")
        cur.execute("SELECT ID, USUARIO, FK_ROL FROM USUARIO")
        users = cur.fetchall()
        for u in users:
            print(u)
        
        # 3. Show Permissions for all roles
        print("\n--- ROL PERMISSIONS ---")
        cur.execute("""
            SELECT rp.fk_rol, r.nombre as rol_name, count(rp.fk_permiso) as perm_count 
            FROM ROL_PERMISO rp 
            JOIN ROL r ON rp.fk_rol = r.id 
            GROUP BY rp.fk_rol, r.nombre
        """)
        perms = cur.fetchall()
        for p in perms:
            print(p)

    conn.close()

if __name__ == "__main__":
    check_roles()
