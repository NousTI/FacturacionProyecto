import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Try to find real env
try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password" 
        DB_PORT = 5432
    env = MockEnv()

def migrate():
    print(f"Connecting to {env.DB_NAME} on {env.DB_HOST}...")
    conn = None
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT
        )
        conn.autocommit = False # Use transactions
        cur = conn.cursor()
        
        print("Adding column 'tipo' to 'solicitudes_renovacion'...")
        
        # 1. Add column with default
        cur.execute("""
            ALTER TABLE sistema_facturacion.solicitudes_renovacion 
            ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'RENOVACION';
        """)
        
        # 2. Update existing records to 'UPGRADE' if plan_id is different from subscription plan_id
        # This helps recover the history correctly
        print("Detecting past upgrades based on plan changes...")
        cur.execute("""
            UPDATE sistema_facturacion.solicitudes_renovacion s
            SET tipo = 'UPGRADE'
            FROM sistema_facturacion.suscripciones sub
            WHERE s.suscripcion_id = sub.id 
            AND s.plan_id != sub.plan_id;
        """)
        updated_rows = cur.rowcount
        print(f"  - {updated_rows} records updated to 'UPGRADE'.")

        # 3. Add CHECK constraint
        print("Adding CHECK constraint...")
        cur.execute("""
            ALTER TABLE sistema_facturacion.solicitudes_renovacion 
            DROP CONSTRAINT IF EXISTS check_tipo_solicitud;
            
            ALTER TABLE sistema_facturacion.solicitudes_renovacion 
            ADD CONSTRAINT check_tipo_solicitud 
            CHECK (tipo IN ('RENOVACION', 'UPGRADE'));
        """)

        # 4. Set NOT NULL
        cur.execute("""
            ALTER TABLE sistema_facturacion.solicitudes_renovacion 
            ALTER COLUMN tipo SET NOT NULL;
        """)

        conn.commit()
        print("\nMigration completed successfully!")
        
        # Verification
        cur.execute("""
            SELECT tipo, COUNT(*) 
            FROM sistema_facturacion.solicitudes_renovacion 
            GROUP BY tipo;
        """)
        stats = cur.fetchall()
        print("\nSummary of records by 'tipo':")
        for t, count in stats:
            print(f"  - {t}: {count}")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"\nError during migration: {str(e)}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate()
