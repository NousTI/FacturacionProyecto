import os
import sys

# Add backend directory to path so we can import models/database
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database.connection import SessionLocal
from sqlalchemy import text

def fix_data():
    db = SessionLocal()
    try:
        print("Cleaning up invalid Vendedor data...")
        
        # Vendedores: Telefono must be 10 digits
        db.execute(text("UPDATE vendedor SET telefono = NULL WHERE length(telefono) != 10"))
        
      # 1. Cleanup Vendedores identification
    with db_session() as db:
        db.execute(text("UPDATE sistema_facturacion.vendedores SET identificacion = NULL WHERE length(identificacion) != 10 AND tipo_identificacion = '05'"))
        db.commit()
        # Empresas: Telefono must be 10 digits
        db.execute(text("UPDATE empresa SET telefono = NULL WHERE length(telefono) != 10"))
        
        db.commit()
        print("Cleanup completed successfully.")
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_data()
