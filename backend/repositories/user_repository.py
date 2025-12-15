from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction

class UserRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create_user(self, fk_suscripcion, fk_rol, correo, contrasena, usuario):
        if not self.db: return None
        try:
            with db_transaction(self.db) as cur:
                cur.execute(
                    """
                    INSERT INTO usuario (fk_suscripcion, fk_rol, usuario, contrasena, correo)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, usuario, correo
                    """,
                    (fk_suscripcion, fk_rol, usuario, contrasena, correo),
                )
                return cur.fetchone()
        except Exception as e:
            print(f"Error creating user: {e}")
            return None

    def get_user_by_email(self, correo):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM usuario WHERE correo=%s", (correo,))
            return cur.fetchone()

    def get_user_by_id(self, user_id):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM usuario WHERE id=%s", (user_id,))
            return cur.fetchone()

    def list_users(self, usuario=None, correo=None, fk_rol=None):
        if not self.db: return []
        with self.db.cursor() as cur:
            query = "SELECT * FROM usuario WHERE 1=1"
            params = []
            
            if usuario:
                query += " AND usuario ILIKE %s"
                params.append(f"%{usuario}%")
            
            if correo:
                query += " AND correo ILIKE %s"
                params.append(f"%{correo}%")
                
            if fk_rol:
                query += " AND fk_rol = %s"
                params.append(fk_rol)
                
            cur.execute(query, tuple(params))
            return cur.fetchall()
