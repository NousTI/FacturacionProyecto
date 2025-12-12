import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_db_connection
from database.transaction import db_transaction

def fix_emails():
    gen = get_db_connection()
    try:
        conn = next(gen)
    except StopIteration:
        print("Failed to connect")
        return

    try:
        with db_transaction(conn) as cur:
            # Find bad emails
            cur.execute("SELECT ID, NOMbre, CORREO FROM CLIENTE WHERE CORREO LIKE '%\n%'")
            rows = cur.fetchall()
            
            if not rows:
                print("No clients found with newlines in email.")
                return

            print(f"Found {len(rows)} clients with bad emails:")
            for row in rows:
                old_email = row['correo']
                # Logic: take the last part after newline, strip whitespace
                # Example: "Guayaquil\nmaria@test.com" -> "maria@test.com"
                parts = old_email.split('\n')
                new_email = parts[-1].strip()
                
                print(f"ID {row['id']}: '{old_email}' -> Will fix to: '{new_email}'")
                
                # Update
                cur.execute(
                    "UPDATE CLIENTE SET CORREO = %s WHERE ID = %s",
                    (new_email, row['id'])
                )
            
            print("Successfully updated bad emails.")

    except Exception as e:
        print(f"Error fixing emails: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_emails()
