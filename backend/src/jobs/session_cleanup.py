import logging
from datetime import datetime, timezone
from src.database.session import get_db
from src.database.transaction import db_transaction

logger = logging.getLogger("facturacion_api.jobs")

def cleanup_expired_sessions():
    """
    Elimina o invalida sesiones que ya han expirado en la base de datos.
    Se recomienda ejecutar este job diariamente.
    """
    logger.info("[JOB] Iniciando limpieza de sesiones expiradas...")
    
    # Opción A: Simplemente marcarlas como inválidas
    # Opción B: Eliminarlas físicamente (más eficiente para ahorro de espacio)
    query_delete = """
        DELETE FROM sistema_facturacion.user_sessions 
        WHERE expires_at < %s OR is_valid = FALSE
    """
    
    db = next(get_db())
    try:
        with db_transaction(db) as cur:
            cur.execute(query_delete, (datetime.now(timezone.utc),))
            rows_deleted = cur.rowcount
            logger.info(f"[JOB] Limpieza completada. Sesiones eliminadas: {rows_deleted}")
            return rows_deleted
    except Exception as e:
        logger.error(f"[JOB] Error durante la limpieza de sesiones: {e}")
        return 0
    finally:
        db.close()

if __name__ == "__main__":
    # Permite ejecución manual por línea de comandos
    logging.basicConfig(level=logging.INFO)
    cleanup_expired_sessions()
