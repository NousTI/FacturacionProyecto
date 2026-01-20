import sys
import os

# Add backend directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection
from psycopg2.extras import RealDictCursor

def clear_sessions():
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        print("Clearing all superadmin sessions...")
        cur.execute("DELETE FROM superadmin_sessions;")
        # Also clear user sessions if needed, but error was for superadmin
        # cur.execute("DELETE FROM user_sessions;")
        conn.commit()
        print("Sessions cleared successfully.")
    except Exception as e:
        print(f"Error clearing sessions: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    clear_sessions()
