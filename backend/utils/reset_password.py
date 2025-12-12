import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection
from database.transaction import db_transaction
from utils.security import get_password_hash

def reset_password(usuario, new_password):
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB")
        return

    try:
        # Hash new password with current safe scheme (pbkdf2_sha256)
        hashed_pw = get_password_hash(new_password)
        
        with db_transaction(conn) as cur:
            cur.execute(
                "UPDATE USUARIO SET CONTRASENA = %s WHERE USUARIO = %s RETURNING ID",
                (hashed_pw, usuario)
            )
            if cur.fetchone():
                print(f"Password for user '{usuario}' updated successfully.")
            else:
                print(f"User '{usuario}' not found.")
                
    except Exception as e:
        print(f"Error resetting password: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python reset_password.py <username> <new_password>")
    else:
        reset_password(sys.argv[1], sys.argv[2])
