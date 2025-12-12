from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction

class ProductoRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def listar_productos(self, nombre: str = None, codigo: str = None):
        if not self.db: return []
        with self.db.cursor() as cur:
            query = """
                SELECT p.id, p.fk_proveedor, p.nombre_producto, p.descripcion, 
                       p.costo_unitario, p.stock, p.codigo_producto,
                       pr.nombre as nombre_proveedor
                FROM PRODUCTO p
                LEFT JOIN PROVEEDOR pr ON p.fk_proveedor = pr.id
            """
            conditions = []
            params = []
            
            if nombre:
                conditions.append("p.nombre_producto ILIKE %s")
                params.append(f"%{nombre}%")
            if codigo:
                conditions.append("p.codigo_producto ILIKE %s")
                params.append(f"%{codigo}%")
                
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
                
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def obtener_producto_por_id(self, producto_id: int):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM PRODUCTO WHERE id = %s", (producto_id,))
            return cur.fetchone()

    def crear_producto(self, datos):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute(
                    """
                    INSERT INTO PRODUCTO (fk_proveedor, nombre_producto, descripcion, costo_unitario, stock, codigo_producto)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, fk_proveedor, nombre_producto, descripcion, costo_unitario, stock, codigo_producto
                    """,
                    (datos.fk_proveedor, datos.nombre_producto, datos.descripcion, datos.costo_unitario, datos.stock, datos.codigo_producto)
                )
                return cur.fetchone()
        except Exception as e:
            print(f"Error creating product: {e}")
            return {"error": str(e)}

    def actualizar_producto(self, producto_id: int, datos):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                # Build dynamic update query
                fields = []
                params = []
                
                if datos.fk_proveedor is not None:
                    fields.append("fk_proveedor=%s")
                    params.append(datos.fk_proveedor)
                if datos.nombre_producto is not None:
                    fields.append("nombre_producto=%s")
                    params.append(datos.nombre_producto)
                if datos.descripcion is not None:
                    fields.append("descripcion=%s")
                    params.append(datos.descripcion)
                if datos.costo_unitario is not None:
                    fields.append("costo_unitario=%s")
                    params.append(datos.costo_unitario)
                if datos.stock is not None:
                    fields.append("stock=%s")
                    params.append(datos.stock)
                if datos.codigo_producto is not None:
                    fields.append("codigo_producto=%s")
                    params.append(datos.codigo_producto)
                    
                if not fields:
                    return {"error": "No fields to update"}
                    
                query = f"UPDATE PRODUCTO SET {', '.join(fields)} WHERE id=%s RETURNING id, fk_proveedor, nombre_producto, descripcion, costo_unitario, stock, codigo_producto"
                params.append(producto_id)
                
                cur.execute(query, tuple(params))
                return cur.fetchone()
        except Exception as e:
            print(f"Error updating product: {e}")
            return {"error": str(e)}

    def eliminar_producto(self, producto_id: int):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute("DELETE FROM PRODUCTO WHERE id=%s RETURNING id", (producto_id,))
                return cur.fetchone()
        except Exception as e:
            print(f"Error deleting product: {e}")
            return {"error": str(e)}
