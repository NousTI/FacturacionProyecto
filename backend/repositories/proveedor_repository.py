from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from typing import List, Optional

class ProveedorRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def listar_proveedores(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        if not self.db: return []
        with self.db.cursor() as cur:
            query = "SELECT * FROM proveedor WHERE activo = TRUE"
            params = []
            
            if empresa_id:
                query += " AND empresa_id = %s"
                params.append(str(empresa_id))
                
            query += " ORDER BY created_at DESC"
            
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def obtener_proveedor_por_id(self, proveedor_id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM proveedor WHERE id = %s", (str(proveedor_id),))
            return cur.fetchone()

    def identificacion_existe(self, identificacion: str, empresa_id: UUID) -> bool:
        if not self.db: return False
        with self.db.cursor() as cur:
            cur.execute(
                "SELECT id FROM proveedor WHERE identificacion = %s AND empresa_id = %s", 
                (identificacion, str(empresa_id))
            )
            return cur.fetchone() is not None

    def crear_proveedor(self, datos: dict) -> Optional[dict]:
        if not self.db: return None
        with db_transaction(self.db) as cur:
            fields = [
                "empresa_id", "identificacion", "tipo_identificacion", 
                "razon_social", "nombre_comercial", "email", "telefono", 
                "direccion", "ciudad", "provincia", "dias_credito", "activo"
            ]
            values = [
                str(datos.get("empresa_id")),
                datos.get("identificacion"),
                datos.get("tipo_identificacion"),
                datos.get("razon_social"),
                datos.get("nombre_comercial"),
                datos.get("email"),
                datos.get("telefono"),
                datos.get("direccion"),
                datos.get("ciudad"),
                datos.get("provincia"),
                datos.get("dias_credito", 0),
                datos.get("activo", True)
            ]
            
            query = f"""
                INSERT INTO proveedor ({', '.join(fields)})
                VALUES ({', '.join(['%s'] * len(fields))})
                RETURNING *
            """
            cur.execute(query, tuple(values))
            return cur.fetchone()

    def actualizar_proveedor(self, proveedor_id: UUID, datos: dict) -> Optional[dict]:
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

            query = f"UPDATE proveedor SET {', '.join(fields)} WHERE id = %s RETURNING *"
            params.append(str(proveedor_id))
            
            cur.execute(query, tuple(params))
            return cur.fetchone()

    def eliminar_proveedor(self, proveedor_id: UUID) -> Optional[dict]:
        # Soft Delete usually preferred, but user schema says ON DELETE CASCADE/RESTRICT references.
        # User prompt SQL: "activo BOOLEAN DEFAULT TRUE". So Soft Delete implies setting activo=False.
        # But schema has ON DELETE constraints.
        # I will implement SOFT DELETE by setting activo = False, 
        # OR real delete if user wants "ELIMINAR". 
        # Permission is "PROVEEDOR_ELIMINAR".
        # Let's do Soft Delete ideally, but if I look at SQL schema, it has "activo".
        # I will do Soft Delete.
        if not self.db: return None
        with db_transaction(self.db) as cur:
            cur.execute(
                "UPDATE proveedor SET activo = FALSE WHERE id=%s RETURNING *", 
                (str(proveedor_id),)
            )
            return cur.fetchone()
