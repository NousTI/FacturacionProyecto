import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection
from database.transaction import db_transaction

def seed_rbac():
    gen = get_db_connection()
    try:
        conn = next(gen)
    except StopIteration:
        print("Failed to connect to DB")
        return
    
    if not conn:
        print("Failed to connect to DB")
        return

    try:
        with db_transaction(conn) as cur:
            # 1. Create Roles if not exist
            roles = ["ADMIN", "VENDEDOR"]
            role_ids = {}
            for role in roles:
                cur.execute("INSERT INTO ROL (NOMBRE) VALUES (%s) ON CONFLICT DO NOTHING RETURNING ID", (role,))
                row = cur.fetchone()
                if row:
                    role_ids[role] = row['id']
                else:
                    cur.execute("SELECT ID FROM ROL WHERE NOMBRE = %s", (role,))
                    role_ids[role] = cur.fetchone()['id']
            
            print(f"Roles: {role_ids}")

            # 2. Update PERMISO table schema (just in case user didn't fully finish or we need CODIGO)
            # Check if CODIGO column exists
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='permiso' AND column_name='codigo'")
            if not cur.fetchone():
                print("Adding CODIGO column to PERMISO")
                cur.execute("ALTER TABLE PERMISO ADD COLUMN CODIGO VARCHAR(50) UNIQUE")
            
            # Sync sequence just in case manual inserts messed it up
            try:
                cur.execute("SELECT setval(pg_get_serial_sequence('permiso', 'id'), coalesce(max(id),0) + 1, false) FROM permiso")
            except Exception as e:
                print(f"Warning syncing sequence: {e}")

            # 3. Seed Permissions
            # List of permissions needed for the implemented features
            permissions = [
                {"codigo": "clients:read", "nombre": "Ver Clientes"},
                {"codigo": "clients:create", "nombre": "Crear Clientes"},
                {"codigo": "clients:update", "nombre": "Editar Clientes"},
                {"codigo": "clients:delete", "nombre": "Eliminar Clientes"},
                {"codigo": "users:read", "nombre": "Ver Usuarios"},
                {"codigo": "users:create", "nombre": "Crear Usuarios"},
                {"codigo": "users:update", "nombre": "Editar Usuarios"},
                {"codigo": "users:delete", "nombre": "Eliminar Usuarios"},
                {"codigo": "providers:read", "nombre": "Ver Proveedores"},
                {"codigo": "providers:create", "nombre": "Crear Proveedores"},
                {"codigo": "providers:update", "nombre": "Editar Proveedores"},
                {"codigo": "providers:delete", "nombre": "Eliminar Proveedores"},
                {"codigo": "products:read", "nombre": "Ver Productos"},
                {"codigo": "products:create", "nombre": "Crear Productos"},
                {"codigo": "products:update", "nombre": "Editar Productos"},
                {"codigo": "products:delete", "nombre": "Eliminar Productos"},
            ]

            perm_ids = {}
            for p in permissions:
                # Upsert permission
                cur.execute("""
                    INSERT INTO PERMISO (CODIGO, NOMBRE) 
                    VALUES (%s, %s) 
                    ON CONFLICT (CODIGO) DO UPDATE SET NOMBRE = EXCLUDED.NOMBRE
                    RETURNING ID
                """, (p["codigo"], p["nombre"]))
                perm_ids[p["codigo"]] = cur.fetchone()['id']
            
            print(f"Permissions: {perm_ids}")

            # 4. Assign Permissions to Roles
            # Admin gets all
            admin_id = role_ids["ADMIN"]
            for code, pid in perm_ids.items():
                cur.execute("INSERT INTO ROL_PERMISO (FK_ROL, FK_PERMISO) VALUES (%s, %s) ON CONFLICT DO NOTHING", (admin_id, pid))
            
            # Vendedor gets Clients CRUD? Or maybe just Read/Create?
            # Assigning Clients CRUD to Vendedor for demo
            vendedor_id = role_ids.get("VENDEDOR")
            if vendedor_id:
                client_perms = [p for p in perm_ids.keys() if "clients" in p]
                for code in client_perms:
                    cur.execute("INSERT INTO ROL_PERMISO (FK_ROL, FK_PERMISO) VALUES (%s, %s) ON CONFLICT DO NOTHING", (vendedor_id, perm_ids[code]))

        print("RBAC Seeded Successfully")

    except Exception as e:
        print(f"Error seeding RBAC: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_rbac()
