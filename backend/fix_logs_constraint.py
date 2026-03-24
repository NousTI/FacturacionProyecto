import psycopg2
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_constraint():
    try:
        conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/facturacion")
        cur = conn.cursor()
        
        logger.info("Dropping existing constraint")
        cur.execute("ALTER TABLE sistema_facturacion.users_logs DROP CONSTRAINT IF EXISTS users_logs_evento_check")
        
        logger.info("Adding updated constraint with new events")
        cur.execute("""
            ALTER TABLE sistema_facturacion.users_logs 
            ADD CONSTRAINT users_logs_evento_check 
            CHECK (evento = ANY (ARRAY[
                'LOGIN_OK', 
                'LOGIN_FALLIDO', 
                'LOGOUT', 
                'PASSWORD_CAMBIADA', 
                'CUENTA_BLOQUEADA', 
                'CUENTA_DESBLOQUEADA', 
                'CUENTA_DESHABILITADA',
                'EMPRESA_ACTUALIZADA',
                'EMPRESA_ESTADO_CAMBIADO',
                'EMPRESA_VENDEDOR_ASIGNADO',
                'COMPROBANTE_GENERADO',
                'COMPROBANTE_ANULADO',
                'PLAN_ACTUALIZADO',
                'USUARIO_CREADO',
                'USUARIO_ELIMINADO',
                'USUARIO_ACTUALIZADO'
            ]))
        """)
        
        conn.commit()
        logger.info("Constraint updated successfully")
        conn.close()
    except Exception as e:
        logger.error(f"Error updating constraint: {e}")
        raise

if __name__ == "__main__":
    fix_constraint()
