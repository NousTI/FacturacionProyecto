import psycopg2
import os
import sys

# Try to find real env as verify_db_v2.py does
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

def update_db():
    conn = None
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print(f"Conectado a la base de datos: {env.DB_NAME}")
        
        # SQL para actualizar la restricción
        sql = """
            -- Primero eliminamos la restricción si existe (buscando por patrón ya que puede ser anónima)
            DO $$
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN (
                    SELECT conname 
                    FROM pg_constraint con
                    INNER JOIN pg_class rel ON rel.oid = con.conrelid
                    INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                    WHERE nsp.nspname = 'sistema_facturacion'
                      AND rel.relname = 'facturas'
                      AND con.contype = 'c'
                      AND pg_get_constraintdef(con.oid) LIKE '%estado_pago%'
                ) LOOP
                    EXECUTE 'ALTER TABLE sistema_facturacion.facturas DROP CONSTRAINT ' || quote_ident(r.conname);
                END LOOP;
            END $$;

            -- Luego agregamos la nueva restricción
            ALTER TABLE sistema_facturacion.facturas 
            ADD CONSTRAINT chk_facturas_estado_pago 
            CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO', 'ANULADO'));
        """
        
        cur.execute(sql)
        print("Restricción de estado_pago actualizada correctamente.")
        
        # También actualizar el estado de cuentas_cobrar para permitir anulado (por si acaso)
        print("Verificando restricción en cuentas_cobrar...")
        sql_cc = """
            DO $$
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN (
                    SELECT conname 
                    FROM pg_constraint con
                    INNER JOIN pg_class rel ON rel.oid = con.conrelid
                    INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                    WHERE nsp.nspname = 'sistema_facturacion'
                      AND rel.relname = 'cuentas_cobrar'
                      AND con.contype = 'c'
                      AND pg_get_constraintdef(con.oid) LIKE '%estado%'
                ) LOOP
                    -- Si no tiene anulado, lo actualizamos
                    IF pg_get_constraintdef(r.oid) NOT LIKE '%anulado%' THEN
                        EXECUTE 'ALTER TABLE sistema_facturacion.cuentas_cobrar DROP CONSTRAINT ' || quote_ident(r.conname);
                        EXECUTE 'ALTER TABLE sistema_facturacion.cuentas_cobrar ADD CONSTRAINT chk_cuentas_cobrar_estado CHECK (estado IN (''pendiente'', ''pagado'', ''vencido'', ''anulado''))';
                    END IF;
                END LOOP;
            END $$;
        """
        cur.execute(sql_cc)
        
        conn.close()
        print("Proceso completado exitosamente.")
        return True
    except Exception as e:
        print(f"Error: {e}")
        if conn:
            conn.close()
        return False

if __name__ == "__main__":
    update_db()
