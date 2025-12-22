from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from database.transaction import db_transaction

class SuperadminRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create_superadmin(self, email, password_hash, nombres, apellidos):
        if not self.db: return None
        # Removed internal hashing. Service must provide hash.
        try:
            with db_transaction(self.db) as cur:
                cur.execute(
                    """
                    INSERT INTO superadmin (email, password_hash, nombres, apellidos)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, email, nombres, apellidos, created_at, updated_at, last_login
                    """,
                    (email, password_hash, nombres, apellidos),
                )
                return cur.fetchone()
        except Exception as e:
            print(f"Error creating superadmin: {e}")
            return None

    def get_superadmin_by_email(self, email):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM superadmin WHERE email=%s", (email,))
            return cur.fetchone()

    def get_superadmin_by_id(self, superadmin_id):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM superadmin WHERE id=%s", (superadmin_id,))
            return cur.fetchone()

    def update_last_login(self, superadmin_id):
        if not self.db: return None
        try:
             with db_transaction(self.db) as cur:
                cur.execute(
                    "UPDATE superadmin SET last_login = NOW() WHERE id = %s",
                    (superadmin_id,)
                )
                return True
        except Exception as e:
            print(f"Error updating last_login: {e}")
            return False
