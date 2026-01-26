from fastapi import Depends
from typing import Optional, List
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class SuperadminRepository:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_perfil_por_user_id(self, user_id: UUID) -> Optional[dict]:
        query = """
            SELECT u.id as user_id, u.email, u.estado, 
                   s.id as profile_id, s.nombres, s.apellidos, s.activo
            FROM sistema_facturacion.users u
            LEFT JOIN sistema_facturacion.superadmin s ON u.id = s.user_id
            WHERE u.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(user_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_perfil(self, user_id: UUID, data: dict) -> bool:
        fields = []
        params = []
        for k, v in data.items():
            fields.append(f"{k} = %s")
            params.append(v)
        
        if not fields:
            return False

        query = f"""
            UPDATE sistema_facturacion.superadmin 
            SET {', '.join(fields)}, updated_at = NOW() 
            WHERE user_id = %s
        """
        params.append(str(user_id))
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(params))
            return cur.rowcount > 0

    def crear_perfil(self, user_id: UUID, nombres: str, apellidos: str) -> Optional[dict]:
        query = """
            INSERT INTO sistema_facturacion.superadmin (user_id, nombres, apellidos)
            VALUES (%s, %s, %s)
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(user_id), nombres, apellidos))
            row = cur.fetchone()
            return dict(row) if row else None
