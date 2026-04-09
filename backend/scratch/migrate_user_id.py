import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def migrate_user_id():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "sistema_facturacion"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "password"),
            port=os.getenv("DB_PORT", "5432"),
            cursor_factory=RealDictCursor
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Set search_path
        cur.execute("SET search_path TO sistema_facturacion, public")
        
        print("Starting migration...")

        # 1. GASTOS
        print("Migrating table 'gastos'...")
        # Check if already renamed
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'gastos' AND column_name = 'user_id'")
        if not cur.fetchone():
            cur.execute("ALTER TABLE gastos RENAME COLUMN usuario_id TO user_id")
            print("- Renamed usuario_id to user_id in gastos")
        
        # Drop old FK and add new one
        cur.execute("""
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gastos_usuario_id_fkey') THEN
                    ALTER TABLE gastos DROP CONSTRAINT gastos_usuario_id_fkey;
                END IF;
            END $$;
        """)
        cur.execute("ALTER TABLE gastos ADD CONSTRAINT gastos_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT")
        print("- Updated FK constraint to reference users(id)")

        # 2. PAGO_GASTO
        print("Migrating table 'pago_gasto'...")
        # Check if already renamed
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'pago_gasto' AND column_name = 'user_id'")
        if not cur.fetchone():
            cur.execute("ALTER TABLE pago_gasto RENAME COLUMN usuario_id TO user_id")
            print("- Renamed usuario_id to user_id in pago_gasto")

        # Find and drop any FK on usuario_id/user_id for pago_gasto
        cur.execute("""
            DO $$ 
            DECLARE 
                cons_name text;
            BEGIN 
                SELECT conname INTO cons_name 
                FROM pg_constraint c 
                JOIN pg_namespace n ON n.oid = c.connamespace 
                WHERE n.nspname = 'sistema_facturacion' 
                  AND conrelid = 'sistema_facturacion.pago_gasto'::regclass 
                  AND contype = 'f' 
                  AND conname LIKE '%usuario%';
                
                IF cons_name IS NOT NULL THEN
                    EXECUTE 'ALTER TABLE pago_gasto DROP CONSTRAINT ' || cons_name;
                END IF;
            END $$;
        """)
        cur.execute("ALTER TABLE pago_gasto ADD CONSTRAINT pago_gasto_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT")
        print("- Updated FK constraint to reference users(id)")

        print("Migration completed successfully!")
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate_user_id()
