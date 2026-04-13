import psycopg2
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

def cleanup():
    empresa_id = "2ba6e903-fb13-4cae-aa74-14d97889b2cf"
    print(f"Limpiando datos de prueba para la empresa {empresa_id}...")
    
    conn = psycopg2.connect(
        host=env.DB_HOST,
        database=env.DB_NAME,
        user=env.DB_USER,
        password=env.DB_PASSWORD,
        port=env.DB_PORT
    )
    cur = conn.cursor()
    
    try:
        # Borrar pagos de hoy para esa empresa que se crearon durante las pruebas (posteriores a las 15:00)
        query = """
            DELETE FROM sistema_facturacion.pagos_suscripciones 
            WHERE empresa_id = %s 
            AND created_at > CURRENT_DATE + TIME '15:00:00'
        """
        cur.execute(query, (empresa_id,))
        deleted = cur.rowcount
        print(f"Se eliminaron {deleted} registros de pagos_suscripciones.")
        
        # También limpiar suscripciones_log de hoy para esa empresa
        query_log = """
            DELETE FROM sistema_facturacion.suscripciones_log
            WHERE suscripcion_id IN (
                SELECT id FROM sistema_facturacion.suscripciones WHERE empresa_id = %s
            )
            AND created_at > CURRENT_DATE + TIME '15:00:00'
        """
        cur.execute(query_log, (empresa_id,))
        print(f"Se eliminaron registros de suscripciones_log.")

        conn.commit()
        print("Limpieza completada exitosamente.")
    except Exception as e:
        conn.rollback()
        print(f"Error durante la limpieza: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    cleanup()
