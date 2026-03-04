import asyncio
import logging
from ...database.session import get_db_connection_raw
from ..empresas.repositories import RepositorioEmpresas

logger = logging.getLogger("facturacion_api")

class AutomationService:
    def __init__(self):
        self._running = False

    async def start_daily_tasks(self):
        """
        Servicio en segundo plano que ejecuta tareas de mantenimiento diarias.
        """
        if self._running:
            return
            
        self._running = True
        logger.info("Iniciando Servicio de Automatización SaaS...")
        
        while self._running:
            try:
                # 1. Procesar Suscripciones Vencidas
                logger.info("Automatización: Buscando suscripciones que expiraron...")
                
                # Usamos una conexión directa para evitar bloqueos con el pool de FastAPI
                conn = get_db_connection_raw()
                try:
                    repo_emp = RepositorioEmpresas(db=conn)
                    count = repo_emp.check_expired_subscriptions(tolerance_days=0)
                    
                    if count > 0:
                        logger.info(f"RESULTADO: {count} empresas marcadas como VENCIDAS y registradas en log.")
                    else:
                        logger.info("RESULTADO: No se encontraron suscripciones nuevas vencidas.")
                        
                finally:
                    conn.close()
                
                # Ejecutar cada 24 horas
                # Nota: El primer ciclo se ejecuta inmediatamente al iniciar el servidor
                await asyncio.sleep(24 * 3600)
                
            except Exception as e:
                logger.error(f"CRITICO: Error en ciclo de automatización: {str(e)}")
                # Si hay error, esperar 10 minutos antes de reintentar
                await asyncio.sleep(600)

    def stop(self):
        """Detiene la ejecución del servicio"""
        self._running = False
        logger.info("Servicio de Automatización detenido.")

# Instancia global para ser importada en main.py
automation_service = AutomationService()
