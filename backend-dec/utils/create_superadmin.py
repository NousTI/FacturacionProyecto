
import psycopg2
from psycopg2.extras import RealDictCursor
import sys
import os

# Add parent directory to path to import config and utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_db_config
from utils.security import get_password_hash

def create_superadmin():
    email = "admin@email.com"
    password = "adminpassword"
    nombres = "Super"
    apellidos = "Admin"
    
    config = get_db_config()
    try:
        conn = psycopg2.connect(
            host=config["host"],
            database=config["database"],
            user=config["user"],
            password=config["password"],
            port=config["port"],
            cursor_factory=RealDictCursor,
        )
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return

    hashed_password = get_password_hash(password)
    
    try:
        with conn.cursor() as cur:
            # Check if exists
            cur.execute("SELECT id FROM superadmin WHERE email = %s", (email,))
            if cur.fetchone():
                print(f"Superadmin {email} already exists.")
                return

            cur.execute(
                """
                INSERT INTO superadmin (email, password_hash, nombres, apellidos)
                VALUES (%s, %s, %s, %s)
                RETURNING id, email
                """,
                (email, hashed_password, nombres, apellidos)
            )
            user = cur.fetchone()
            conn.commit()
            print(f"Successfully created superadmin with ID: {user['id']}")
            print(f"Email: {user['email']}")
            print(f"Password: {password}")
            
    except Exception as e:
        print(f"Error creating user: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_superadmin()
