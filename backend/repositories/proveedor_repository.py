from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction

class ProveedorRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def listar_proveedores(self):
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("SELECT id, nombre, ruc, direccion, telefono FROM PROVEEDOR")
            return cur.fetchall()

    def obtener_proveedor_por_id(self, proveedor_id: int):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT id, nombre, ruc, direccion, telefono FROM PROVEEDOR WHERE id = %s", (proveedor_id,))
            return cur.fetchone()

    def crear_proveedor(self, datos):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute(
                    """
                    INSERT INTO PROVEEDOR (nombre, ruc, direccion, telefono)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, nombre, ruc, direccion, telefono
                    """,
                    (datos.nombre, datos.ruc, datos.direccion, datos.telefono)
                )
                return cur.fetchone()
        except Exception as e:
            print(f"Error creating provider: {e}")
            return {"error": str(e)}

    def actualizar_proveedor(self, proveedor_id: int, datos):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute(
                    """
                    UPDATE PROVEEDOR
                    SET nombre=%s, ruc=%s, direccion=%s, telefono=%s
                    WHERE id=%s
                    RETURNING id, nombre, ruc, direccion, telefono
                    """,
                    (datos.nombre, datos.ruc, datos.direccion, datos.telefono, proveedor_id)
                )
                return cur.fetchone()
        except Exception as e:
            print(f"Error updating provider: {e}")
            return {"error": str(e)}

    def eliminar_proveedor(self, proveedor_id: int):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute("DELETE FROM PROVEEDOR WHERE id=%s RETURNING id", (proveedor_id,))
                return cur.fetchone()
        except Exception as e:
            print(f"Error deleting provider: {e}")
            return {"error": str(e)}
