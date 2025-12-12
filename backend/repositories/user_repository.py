from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction

class UserRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create_user(self, fk_rol, fk_suscripcion, usuario, hashed_password, correo):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute(
                    """
                    INSERT INTO USUARIO (FK_ROL, FK_SUSCRIPCION, USUARIO, CONTRASENA, CORREO)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING ID, FK_ROL, FK_SUSCRIPCION, USUARIO, CORREO
                    """,
                    (fk_rol, fk_suscripcion, usuario, hashed_password, correo),
                )
                new_user = cur.fetchone()
            return new_user
        except Exception as e:
            print(f"Error creating user: {e}")
            return None

    def get_user_by_usuario(self, usuario):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM USUARIO WHERE USUARIO=%s", (usuario,))
            return cur.fetchone()

    def get_user_by_id(self, user_id):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM USUARIO WHERE ID=%s", (user_id,))
            return cur.fetchone()

    def list_users(self, usuario: str = None, correo: str = None, fk_rol: int = None):
        if not self.db: return []
        with self.db.cursor() as cur:
            query = "SELECT ID, FK_ROL, FK_SUSCRIPCION, USUARIO, CORREO FROM USUARIO"
            conditions = []
            params = []
            
            if usuario:
                conditions.append("USUARIO ILIKE %s")
                params.append(f"%{usuario}%")
            if correo:
                conditions.append("CORREO ILIKE %s")
                params.append(f"%{correo}%")
            if fk_rol:
                conditions.append("FK_ROL = %s")
                params.append(fk_rol)
                
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
                
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def update_user(self, user_id, fk_rol, fk_suscripcion, usuario, correo, hashed_password=None):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                if hashed_password:
                    # Update with password
                    cur.execute(
                        """
                        UPDATE USUARIO
                        SET FK_ROL=%s, FK_SUSCRIPCION=%s, USUARIO=%s, CORREO=%s, CONTRASENA=%s
                        WHERE ID=%s
                        RETURNING ID, FK_ROL, FK_SUSCRIPCION, USUARIO, CORREO
                        """,
                        (fk_rol, fk_suscripcion, usuario, correo, hashed_password, user_id)
                    )
                else:
                    # Update without password
                    cur.execute(
                        """
                        UPDATE USUARIO
                        SET FK_ROL=%s, FK_SUSCRIPCION=%s, USUARIO=%s, CORREO=%s
                        WHERE ID=%s
                        RETURNING ID, FK_ROL, FK_SUSCRIPCION, USUARIO, CORREO
                        """,
                        (fk_rol, fk_suscripcion, usuario, correo, user_id)
                    )
                return cur.fetchone()
        except Exception as e:
            print(f"Error updating user: {e}")
            return None

    def delete_user(self, user_id):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute("DELETE FROM USUARIO WHERE ID=%s RETURNING ID", (user_id,))
                return cur.fetchone()
        except Exception as e:
            print(f"Error deleting user: {e}")
            return None
