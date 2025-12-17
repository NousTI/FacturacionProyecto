from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID

class ProductoRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def listar_productos(self, empresa_id: UUID, nombre: str = None, codigo: str = None):
        if not self.db: return []
        with self.db.cursor() as cur:
            query = """
                SELECT p.*, pr.nombre as nombre_proveedor
                FROM producto p
                LEFT JOIN proveedor pr ON p.proveedor_id = pr.id
                WHERE p.empresa_id = %s AND p.activo = TRUE
            """
            params = [str(empresa_id)]
            
            if nombre:
                query += " AND p.nombre ILIKE %s"
                params.append(f"%{nombre}%")
            if codigo:
                query += " AND p.codigo_producto ILIKE %s"
                params.append(f"%{codigo}%")
                
            query += " ORDER BY p.created_at DESC"
                
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def obtener_producto_por_id(self, producto_id: UUID):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT p.*, pr.nombre as nombre_proveedor 
                FROM producto p
                LEFT JOIN proveedor pr ON p.proveedor_id = pr.id
                WHERE p.id = %s
            """, (str(producto_id),))
            return cur.fetchone()

    def codigo_existe(self, codigo: str, empresa_id: UUID):
        if not self.db: return False
        with self.db.cursor() as cur:
            cur.execute(
                "SELECT id FROM producto WHERE codigo_producto = %s AND empresa_id = %s", 
                (codigo, str(empresa_id))
            )
            return cur.fetchone() is not None

    def crear_producto(self, datos: dict):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                fields = ["empresa_id", "proveedor_id", "nombre", "descripcion", "costo_unitario", "stock", "codigo_producto", "activo"]
                values = [
                    str(datos.get("empresa_id")),
                    str(datos.get("proveedor_id")),
                    datos.get("nombre"),
                    datos.get("descripcion"),
                    datos.get("costo_unitario"),
                    datos.get("stock"),
                    datos.get("codigo_producto"),
                    datos.get("activo", True)
                ]
                
                query = f"""
                    INSERT INTO producto ({', '.join(fields)})
                    VALUES ({', '.join(['%s'] * len(fields))})
                    RETURNING *
                """
                cur.execute(query, tuple(values))
                # Need to fetch again to get provider name if we want to return it immediately or just return basic
                # For simplicity, returning what is inserted is standard, usually standard CRUD returns just the object.
                return cur.fetchone()
        except Exception as e:
            print(f"Error creating product: {e}")
            return {"error": str(e)}

    def actualizar_producto(self, producto_id: UUID, datos: dict):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                fields = []
                params = []
                
                for key, value in datos.items():
                    if value is not None:
                        if key == "proveedor_id":
                            fields.append(f"{key} = %s")
                            params.append(str(value)) # ensure UUID conversion
                        else:
                            fields.append(f"{key} = %s")
                            params.append(value)
                
                fields.append("updated_at = NOW()")
                
                if not fields:
                    return None
                    
                query = f"UPDATE producto SET {', '.join(fields)} WHERE id=%s RETURNING *"
                params.append(str(producto_id))
                
                cur.execute(query, tuple(params))
                return cur.fetchone()
        except Exception as e:
            print(f"Error updating product: {e}")
            return {"error": str(e)}

    def eliminar_producto(self, producto_id: UUID):
        # Soft Delete
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute("UPDATE producto SET activo = FALSE WHERE id=%s RETURNING *", (str(producto_id),))
                return cur.fetchone()
        except Exception as e:
            print(f"Error deleting product: {e}")
            return {"error": str(e)}
