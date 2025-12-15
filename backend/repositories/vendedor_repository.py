import json
from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from models.Vendedor import VendedorCreate, VendedorUpdate
from typing import List, Optional
from uuid import UUID

class VendedorRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create(self, vendedor: VendedorCreate, password_hash: str):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute(
                    """
                    INSERT INTO vendedor (
                        email, password_hash, nombres, apellidos, telefono, 
                        documento_identidad, porcentaje_comision, tipo_comision, 
                        puede_crear_empresas, puede_gestionar_planes, puede_ver_reportes, 
                        activo, configuracion
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        vendedor.email, password_hash, vendedor.nombres, vendedor.apellidos, 
                        vendedor.telefono, vendedor.documento_identidad, vendedor.porcentaje_comision, 
                        vendedor.tipo_comision, vendedor.puede_crear_empresas, vendedor.puede_gestionar_planes, 
                        vendedor.puede_ver_reportes, vendedor.activo, 
                        json.dumps(vendedor.configuracion) if vendedor.configuracion else None
                    ),
                )
                return cur.fetchone()
        except Exception as e:
            print(f"Error creating vendedor: {e}")
            raise e

    def get_by_id(self, vendedor_id: UUID):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM vendedor WHERE id = %s", (str(vendedor_id),))
            return cur.fetchone()

    def get_by_email(self, email: str):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM vendedor WHERE email = %s", (email,))
            return cur.fetchone()

    def get_all(self, skip: int = 0, limit: int = 100):
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM vendedor OFFSET %s LIMIT %s", (skip, limit))
            return cur.fetchall()

    def update(self, vendedor_id: UUID, vendedor: VendedorUpdate, password_hash: Optional[str] = None):
        if not self.db: return None
        
        # Build dynamic query
        fields = []
        values = []

        if vendedor.email is not None:
            fields.append("email = %s")
            values.append(vendedor.email)
        if vendedor.nombres is not None:
            fields.append("nombres = %s")
            values.append(vendedor.nombres)
        if vendedor.apellidos is not None:
            fields.append("apellidos = %s")
            values.append(vendedor.apellidos)
        if vendedor.telefono is not None:
            fields.append("telefono = %s")
            values.append(vendedor.telefono)
        if vendedor.documento_identidad is not None:
            fields.append("documento_identidad = %s")
            values.append(vendedor.documento_identidad)
        if vendedor.porcentaje_comision is not None:
            fields.append("porcentaje_comision = %s")
            values.append(vendedor.porcentaje_comision)
        if vendedor.tipo_comision is not None:
            fields.append("tipo_comision = %s")
            values.append(vendedor.tipo_comision)
        if vendedor.puede_crear_empresas is not None:
            fields.append("puede_crear_empresas = %s")
            values.append(vendedor.puede_crear_empresas)
        if vendedor.puede_gestionar_planes is not None:
            fields.append("puede_gestionar_planes = %s")
            values.append(vendedor.puede_gestionar_planes)
        if vendedor.puede_ver_reportes is not None:
            fields.append("puede_ver_reportes = %s")
            values.append(vendedor.puede_ver_reportes)
        if vendedor.activo is not None:
            fields.append("activo = %s")
            values.append(vendedor.activo)
        if vendedor.configuracion is not None:
            fields.append("configuracion = %s")
            values.append(json.dumps(vendedor.configuracion)) # Serialize dict to JSON string
        if password_hash is not None:
            fields.append("password_hash = %s")
            values.append(password_hash)

        if not fields:
            return self.get_by_id(vendedor_id)

        fields.append("updated_at = NOW()")
        
        query = f"UPDATE vendedor SET {', '.join(fields)} WHERE id = %s RETURNING *"
        values.append(str(vendedor_id))

        try:
            with db_transaction(self.db) as cur:
                cur.execute(query, tuple(values))
                return cur.fetchone()
        except Exception as e:
            print(f"Error updating vendedor: {e}")
            raise e

    def delete(self, vendedor_id: UUID):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute("DELETE FROM vendedor WHERE id = %s RETURNING id", (str(vendedor_id),))
                return cur.fetchone()
        except Exception as e:
            print(f"Error deleting vendedor: {e}")
            raise e
