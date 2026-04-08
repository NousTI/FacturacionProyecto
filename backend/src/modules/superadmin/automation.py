import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from ...database.session import get_db_connection_raw
from ..empresas.repositories import RepositorioEmpresas
from ..facturas.services.service_factura import ServicioFactura
from ..facturas.services.invoice_core import ServicioFacturaCore
from ..facturas.repository import RepositorioFacturas
from ..clientes.repositories import RepositorioClientes
from ..usuarios.repositories import RepositorioUsuarios
from ..puntos_emision.repository import RepositorioPuntosEmision
from ..establecimientos.repository import RepositorioEstablecimientos
from ..formas_pago.repository import RepositorioFormasPago
from ..cuentas_cobrar.repository import RepositorioCuentasCobrar
from ..pagos_factura.repository import RepositorioPagosFactura

logger = logging.getLogger("facturacion_api")


class AutomationService:
    def __init__(self):
        self._scheduler = AsyncIOScheduler()

    def _run_daily_tasks(self):
        """Ejecuta las tareas diarias: suscripciones y facturación recurrente."""
        logger.info("Automatización: Iniciando ciclo diario...")
        conn = get_db_connection_raw()
        try:
            # 1. Procesar suscripciones vencidas
            repo_emp = RepositorioEmpresas(db=conn)
            count = repo_emp.check_expired_subscriptions(tolerance_days=0)
            if count > 0:
                logger.info(f"RESULTADO SUSCRIPCIONES: {count} empresas vencidas.")

            # 2. Procesar Facturación Programada (Recurrente)
            logger.info("Automatización: Procesando Facturación Recurrente...")

            from ..facturas.repository_programacion import RepositorioProgramacion
            from ..facturas.services.recurring_service import ServicioRecurringBilling
            from ..facturas.services.service_autorizacion import ServicioAutorizacion
            from ..facturas.services.sri_service import ServicioSRIFacturas
            from ..clientes.services import ServicioClientes
            from ..establecimientos.service import ServicioEstablecimientos
            from ..puntos_emision.service import ServicioPuntosEmision
            from ..empresas.services import ServicioEmpresas
            from ..sri.repository import RepositorioSRI
            from ..sri.client import ClienteSRI
            from ..sri.xml_service import ServicioSRIXML
            from ..sri.signer import XMLSigner
            from ..sri.cert_utils import ExtractorCertificadoSRI
            from ..sri.service import ServicioSRI
            from ..logs.repository import RepositorioLogs
            from ..logs.service import ServicioLogs

            # Repositorios base
            repo_prog = RepositorioProgramacion(db=conn)
            repo_cli = RepositorioClientes(db=conn)
            repo_user = RepositorioUsuarios(db=conn)
            repo_fact = RepositorioFacturas(db=conn)
            repo_forma = RepositorioFormasPago(db=conn)
            repo_cc = RepositorioCuentasCobrar(db=conn)
            repo_pago = RepositorioPagosFactura(db=conn)
            repo_pe = RepositorioPuntosEmision(db=conn)
            repo_est = RepositorioEstablecimientos(db=conn)
            repo_sri = RepositorioSRI(db=conn)
            repo_logs = RepositorioLogs(db=conn)

            # Servicios intermedios
            s_est = ServicioEstablecimientos(repo=repo_est)
            s_cli = ServicioClientes(repo=repo_cli)
            s_emp = ServicioEmpresas(repo=repo_emp)
            s_pe = ServicioPuntosEmision(repo=repo_pe, establecimiento_service=s_est)
            s_logs = ServicioLogs(repo=repo_logs)

            # Core de facturas
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

            # SRI
            sri_core = ServicioSRI(
                repo=repo_sri,
                factura_repo=repo_fact,
                empresa_repo=repo_emp,
                cliente_repo=repo_cli,
                log_repo=repo_logs,
                formas_pago_repo=repo_forma,
                client_sri=ClienteSRI(),
                xml_service=ServicioSRIXML(),
                logs_service=s_logs
            )
            sri_facturas = ServicioSRIFacturas(repo=repo_fact, sri_core=sri_core)

            service_autorizacion = ServicioAutorizacion(
                core=core_factura,
                sri_facturacion=sri_facturas,
                usuario_repo=repo_user,
                cuentas_cobrar_repo=repo_cc
            )

            service_prog = ServicioRecurringBilling(
                repo_prog=repo_prog,
                service_factura=service_factura,
                service_autorizacion=service_autorizacion,
                repo_pe=repo_pe,
                repo_usuarios=repo_user
            )
            resultado = service_prog.procesar_emisiones_automaticas()
            logger.info(f"FACTURACION_RECURRENTE: {resultado}")

        except Exception as e:
            logger.error(f"CRITICO: Error en ciclo de automatización: {str(e)}")
        finally:
            conn.close()

    async def start_daily_tasks(self):
        """
        Inicia el scheduler APScheduler.
        El primer ciclo se ejecuta inmediatamente al arrancar el servidor.
        Los siguientes se ejecutan diariamente a las 08:00.
        """
        if self._scheduler.running:
            return

        # Ejecución diaria a las 08:00
        self._scheduler.add_job(
            self._run_daily_tasks,
            trigger='cron',
            hour=8,
            minute=0,
            id='daily_automation',
            replace_existing=True
        )
        self._scheduler.start()
        logger.info("Servicio de Automatización iniciado (cron: 08:00 diario).")

        # Primera ejecución inmediata al arrancar
        self._run_daily_tasks()

    def stop(self):
        """Detiene el scheduler."""
        if self._scheduler.running:
            self._scheduler.shutdown(wait=False)
        logger.info("Servicio de Automatización detenido.")


# Instancia global para ser importada en main.py
automation_service = AutomationService()
