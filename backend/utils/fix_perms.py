import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection
from database.transaction import db_transaction

def fix_admin_permissions():
    gen = get_db_connection()
    try:
        conn = next(gen)
    except StopIteration:
        print("Failed to connect")
        return

    try:
        with db_transaction(conn) as cur:
            # 1. Get Admin Role ID
            cur.execute("SELECT ID FROM ROL WHERE NOMBRE = 'ADMIN'")
            row = cur.fetchone()
            if not row:
                print("Role ADMIN not found!")
                return
            admin_id = row['id']
            print(f"Found ADMIN role with ID: {admin_id}")

            # 2. Get All Permission IDs
            cur.execute("SELECT ID, CODIGO FROM PERMISO WHERE CODIGO IS NOT NULL")
            perms = cur.fetchall()
            print(f"Found {len(perms)} permissions")

            # 3. Assign All to Admin
            count = 0
            for p in perms:
                perm_id = p['id']
                cur.execute(
                    "INSERT INTO ROL_PERMISO (FK_ROL, FK_PERMISO) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (admin_id, perm_id)
                )
                count += 1
            
            print(f"assigned {count} permissions to Role {admin_id}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_admin_permissions()
