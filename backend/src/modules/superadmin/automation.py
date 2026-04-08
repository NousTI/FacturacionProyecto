import asyncio
import logging
from ...database.session import get_db_connection_raw
from ..empresas.repositories import RepositorioEmpresas
from ..facturas.services.service_factura import ServicioFactura
from ..facturas.services.invoice_core import ServicioFacturaCore
from ..facturas.repository import RepositorioFacturas
from ..clientes.repositories import RepositorioClientes
from ..usuarios.repositories import RepositorioUsuarios
from ..puntos_emision.repository import RepositorioPuntosEmision
from ..establecimientos.repository import RepositorioEstablecimientos
from ..productos.repository import RepositorioProductos
from ..formas_pago.repository import RepositorioFormasPago
from ..cuentas_cobrar.repository import RepositorioCuentasCobrar
from ..pagos_factura.repository import RepositorioPagosFactura

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
                    # Contexto para suscripciones
                    repo_emp = RepositorioEmpresas(db=conn)
                    count = repo_emp.check_expired_subscriptions(tolerance_days=0)
                    
                    if count > 0:
                        logger.info(f"RESULTADO SUSCRIPCIONES: {count} empresas vencidas.")
                    
                    # 2. Procesar Facturación Programada (Recurrente)
                    logger.info("Automatización: Procesando Facturación Recurrente...")
                    
                    from ..facturas.repository_programacion import RepositorioProgramacion
                    from ..facturas.services.recurring_service import ServicioRecurringBilling

                    # Instanciar repositorios
                    repo_prog = RepositorioProgramacion(db=conn)
                    repo_cli = RepositorioClientes(db=conn)
                    repo_user = RepositorioUsuarios(db=conn)
                    repo_fact = RepositorioFacturas(db=conn)
                    repo_prod = RepositorioProductos(db=conn)
                    repo_forma = RepositorioFormasPago(db=conn)
                    repo_cc = RepositorioCuentasCobrar(db=conn)
                    repo_pago = RepositorioPagosFactura(db=conn)
                    repo_pe = RepositorioPuntosEmision(db=conn)
                    repo_est = RepositorioEstablecimientos(db=conn)

                    # Importar servicios
                    from ..clientes.services import ServicioClientes
                    from ..establecimientos.service import ServicioEstablecimientos
                    from ..puntos_emision.service import ServicioPuntosEmision
                    from ..empresas.services import ServicioEmpresas
                    
                    # Instanciar servicios intermedios (colaboradores)
                    s_est = ServicioEstablecimientos(repo=repo_est)
                    s_cli = ServicioClientes(repo=repo_cli)
                    s_emp = ServicioEmpresas(repo=repo_emp)
                    s_pe = ServicioPuntosEmision(repo=repo_pe, establecimiento_service=s_est)

                    # Construir core de facturas con TODOS sus argumentos requeridos
                    core_factura = ServicioFacturaCore(
                        repo=repo_fact,
                        cliente_service=s_cli,
                        establecimiento_service=s_est,
                        punto_emision_service=s_pe,
                        punto_emision_repo=repo_pe,
                        empresa_service=s_emp
                    )

                    service_factura = ServicioFactura(
                        core=core_factura,
                        usuario_repo=repo_user,
                        formas_pago_repo=repo_forma,
                        cuentas_cobrar_repo=repo_cc,
                        pagos_repo=repo_pago
                    )

                    service_prog = ServicioRecurringBilling(
                        repo_prog=repo_prog, 
                        service_factura=service_factura,
                        repo_pe=repo_pe
                    )
                    service_prog.procesar_emisiones_automaticas()
                    
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
