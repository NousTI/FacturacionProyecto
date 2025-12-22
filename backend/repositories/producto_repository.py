from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from typing import List, Optional

class ProductoRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def listar_productos(self, empresa_id: Optional[UUID] = None, nombre: Optional[str] = None, codigo: Optional[str] = None) -> List[dict]:
        if not self.db: return []
        with self.db.cursor() as cur:
            query = "SELECT * FROM producto WHERE activo = TRUE"
            params = []
            
            if empresa_id:
                query += " AND empresa_id = %s"
                params.append(str(empresa_id))

            
            if nombre:
                query += " AND nombre ILIKE %s"
                params.append(f"%{nombre}%")
            if codigo:
                query += " AND codigo ILIKE %s"
                params.append(f"%{codigo}%")
                
            query += " ORDER BY created_at DESC"
                
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def obtener_producto_por_id(self, producto_id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT *
                FROM producto
                WHERE id = %s
            """, (str(producto_id),))
            return cur.fetchone()

    def codigo_existe(self, codigo: str, empresa_id: UUID) -> bool:
        if not self.db: return False
        with self.db.cursor() as cur:
            cur.execute(
                "SELECT id FROM producto WHERE codigo = %s AND empresa_id = %s", 
                (codigo, str(empresa_id))
            )
            return cur.fetchone() is not None

    def crear_producto(self, datos: dict) -> Optional[dict]:
        if not self.db: return None
        
        with db_transaction(self.db) as cur:
            fields = [
                "empresa_id", "codigo", "nombre", "descripcion", 
                "precio", "costo", "stock_actual", "stock_minimo",
                "tipo_iva", "porcentaje_iva", "maneja_inventario",
                "tipo", "unidad_medida", "activo"
            ]
            values = [
                str(datos.get("empresa_id")),
                datos.get("codigo"),
                datos.get("nombre"),
                datos.get("descripcion"),
                datos.get("precio"),
                datos.get("costo"),
                datos.get("stock_actual", 0),
                datos.get("stock_minimo", 0),
                datos.get("tipo_iva"),
                datos.get("porcentaje_iva"),
                datos.get("maneja_inventario", True),
                datos.get("tipo"),
                datos.get("unidad_medida"),
                datos.get("activo", True)
            ]
            
            query = f"""
                INSERT INTO producto ({', '.join(fields)})
                VALUES ({', '.join(['%s'] * len(fields))})
                RETURNING *
            """
            cur.execute(query, tuple(values))
            return cur.fetchone()

    def actualizar_producto(self, producto_id: UUID, datos: dict) -> Optional[dict]:
        if not self.db: return None
        
        with db_transaction(self.db) as cur:
            fields = []
            params = []
            
            for key, value in datos.items():
                if value is not None:
                    fields.append(f"{key} = %s")
                    params.append(value)
            
            fields.append("updated_at = NOW()")
            
            if not fields:
                return None
                
            query = f"UPDATE producto SET {', '.join(fields)} WHERE id=%s RETURNING *"
            params.append(str(producto_id))
            
            cur.execute(query, tuple(params))
            return cur.fetchone()

    def eliminar_producto(self, producto_id: UUID) -> Optional[dict]:
        # Soft Delete
        if not self.db: return None
        with db_transaction(self.db) as cur:
            cur.execute("UPDATE producto SET activo = FALSE WHERE id=%s RETURNING *", (str(producto_id),))
            return cur.fetchone()
