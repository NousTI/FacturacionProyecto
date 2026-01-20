import asyncio
from datetime import datetime, time, timedelta
import logging

from ...database.session import get_db_connection_raw
from ...config.env import env

logger = logging.getLogger("automation")

class AutomationService:
    def __init__(self):
        self._running = False

    async def start_daily_tasks(self):
        """Inicia el bucle infinito para tareas diarias."""
        if self._running:
            return
        self._running = True
        logger.info("Servicio de Automatización iniciado")
        
        while self._running:
            try:
                # Ejecutar revisión de suscripciones
                await self.run_subscription_check()
                
                # Calcular tiempo hasta la próxima medianoche (00:01)
                now = datetime.now()
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
                await asyncio.sleep(60)

    async def run_subscription_check(self):
        """Tarea para revisar suscripciones vencidas."""
        logger.info("Iniciando revisión diaria de suscripciones...")
        try:
            conn = get_db_connection_raw()
            if not conn: return
            
            with conn.cursor() as cur:
                # 1. Obtener tolerancia
                cur.execute("SELECT valor FROM configuracion_global WHERE clave = 'dias_tolerancia_vencimiento'")
                res = cur.fetchone()
                tolerance = int(res['valor']) if res else 0
                
                # 2. Ejecutar actualización de suscripciones (Lógica simplificada equivalente a la legacy)
                # Esta es una recreación de la lógica que estaba en el repositorio legacy
                query = """
                    UPDATE empresa 
                    SET activo = false 
                    WHERE id IN (
                        SELECT empresa_id 
                        FROM pago_suscripcion 
                        WHERE fecha_fin_periodo < (CURRENT_DATE - INTERVAL '%s days')
                        AND estado IN ('PAGADO', 'COMPLETED')
                    )
                """
                cur.execute(query, (tolerance,))
                updated = cur.rowcount
                conn.commit()
                logger.info(f"Revisión completada. {updated} empresas desactivadas por suscripción vencida.")
        except Exception as e:
            logger.error(f"Error al revisar suscripciones: {str(e)}")
        finally:
            if 'conn' in locals() and conn:
                conn.close()

    def stop(self):
        self._running = False
        logger.info("Servicio de Automatización detenido")

automation_service = AutomationService()
