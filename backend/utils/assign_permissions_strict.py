import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection
from database.transaction import db_transaction

def assign_strict():
    gen = get_db_connection()
    try:
        conn = next(gen)
    except StopIteration:
        return

    try:
        with db_transaction(conn) as cur:
            # 1. Define all permissions (Old + New)
            permissions = [
                # Existing
                {"codigo": "clients:read", "nombre": "Ver Clientes"},
                {"codigo": "clients:create", "nombre": "Crear Clientes"},
                {"codigo": "clients:update", "nombre": "Editar Clientes"},
                {"codigo": "clients:delete", "nombre": "Eliminar Clientes"},
                {"codigo": "users:read", "nombre": "Ver Usuarios"},
                {"codigo": "users:create", "nombre": "Crear Usuarios"},
                {"codigo": "users:update", "nombre": "Editar Usuarios"},
                {"codigo": "users:delete", "nombre": "Eliminar Usuarios"},
                # New Product/Provider
                {"codigo": "providers:read", "nombre": "Ver Proveedores"},
                {"codigo": "providers:create", "nombre": "Crear Proveedores"},
                {"codigo": "providers:update", "nombre": "Editar Proveedores"},
                {"codigo": "providers:delete", "nombre": "Eliminar Proveedores"},
                {"codigo": "products:read", "nombre": "Ver Productos"},
                {"codigo": "products:create", "nombre": "Crear Productos"},
                {"codigo": "products:update", "nombre": "Editar Productos"},
                {"codigo": "products:delete", "nombre": "Eliminar Productos"},
            ]

            print("--- Ensuring Permissions Exist ---")
            perm_ids = {}
            for p in permissions:
                # Upsert permission
                cur.execute("""
                    INSERT INTO PERMISO (CODIGO, NOMBRE) 
                    VALUES (%s, %s) 
                    ON CONFLICT (CODIGO) DO UPDATE SET NOMBRE = EXCLUDED.NOMBRE
                    RETURNING ID
                """, (p["codigo"], p["nombre"]))
                pid = cur.fetchone()['id']
                perm_ids[p["codigo"]] = pid
            
            # 2. Assign to Role 1 (ADMIN)
            print("--- Assigning to Role 1 (ADMIN) ---")
            role_id = 1
            count = 0
            for code, pid in perm_ids.items():
                cur.execute("""
                    INSERT INTO ROL_PERMISO (FK_ROL, FK_PERMISO) 
                    VALUES (%s, %s) 
                    ON CONFLICT (FK_ROL, FK_PERMISO) DO NOTHING
                """, (role_id, pid))
                count += 1
            
            print(f"Verified/Assigned {count} permissions to Role ID {role_id}.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    assign_strict()
