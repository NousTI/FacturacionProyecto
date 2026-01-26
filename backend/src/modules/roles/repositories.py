from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from ...database.session import get_db
from ...database.transaction import db_transaction

class RolesRepository:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_roles(self) -> List[dict]:
        query = "SELECT * FROM sistema_facturacion.roles ORDER BY nombre ASC"
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def obtener_rol_por_id(self, rol_id: UUID) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.roles WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(rol_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_rol_por_codigo(self, codigo: str) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.roles WHERE codigo = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (codigo,))
            row = cur.fetchone()
            return dict(row) if row else None

    # --- Asignación de Roles ---
    def obtener_roles_usuario(self, user_id: UUID) -> List[dict]:
        query = """
            SELECT r.* 
            FROM sistema_facturacion.roles r
            JOIN sistema_facturacion.user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(user_id),))
            return [dict(row) for row in cur.fetchall()]

    def asignar_rol(self, user_id: UUID, role_id: UUID):
        query = "INSERT INTO sistema_facturacion.user_roles (user_id, role_id) VALUES (%s, %s) ON CONFLICT DO NOTHING"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(user_id), str(role_id)))

    def remover_rol(self, user_id: UUID, role_id: UUID):
        query = "DELETE FROM sistema_facturacion.user_roles WHERE user_id = %s AND role_id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(user_id), str(role_id)))

    # --- Auditoría ---
    def registrar_log_rol(self, user_id: UUID, role_id: UUID, accion: str, realizado_por: UUID = None, origen: str = 'SUPERADMIN', motivo: str = None):
        query = """
            INSERT INTO sistema_facturacion.users_roles_logs (user_id, role_id, accion, realizado_por, origen, motivo)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (
                str(user_id), 
                str(role_id), 
                accion, 
                str(realizado_por) if realizado_por else None, 
                origen, 
                motivo
            ))
