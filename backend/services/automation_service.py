import asyncio
from datetime import datetime, time, timedelta
from utils.logger import get_logger
from repositories.empresa_repository import EmpresaRepository
from database.connection import get_db_connection_raw

logger = get_logger("automation")

class AutomationService:
    def __init__(self):
        self._running = False

    async def start_daily_tasks(self):
        """Starts the infinite loop for daily tasks."""
        if self._running:
            return
        self._running = True
        logger.info("Servicio de Automatización iniciado")
        
        while self._running:
            try:
                # 1. Run tasks now
                self.run_subscription_check()
                
                # 2. Calculate time until next midnight
                now = datetime.now()
                # Target is tomorrow at 00:01
                tomorrow = now + timedelta(days=1)
                next_run = datetime.combine(tomorrow.date(), time(0, 1))
                
                seconds_to_wait = (next_run - now).total_seconds()
                logger.info(f"Próxima revisión de suscripciones en {seconds_to_wait/3600:.2f} horas ({next_run})")
                
                await asyncio.sleep(seconds_to_wait)
                
            except asyncio.CancelledError:
                self._running = False
                break
            except Exception as e:
                logger.error(f"Error en loop de automatización: {str(e)}")
                # wait a bit before retrying
                await asyncio.sleep(60)

    def run_subscription_check(self):
        """Sync method to call the repository logic."""
        logger.info("Iniciando revisión diaria de suscripciones...")
        conn = None
        try:
            conn = get_db_connection_raw()
            repo = EmpresaRepository(conn)
            expired_count = repo.check_expired_subscriptions()
            logger.info(f"Revisión completada. {expired_count} suscripciones marcadas como VENCIDAS.")
        except Exception as e:
            logger.error(f"Error al revisar suscripciones: {str(e)}")
        finally:
            if conn:
                conn.close()

    def stop(self):
        self._running = False
        logger.info("Servicio de Automatización detenido")

# Singleton instance
automation_service = AutomationService()
