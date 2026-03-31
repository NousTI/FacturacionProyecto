from fastapi import APIRouter, Depends
from ..modules.autenticacion.routes import router as auth_router
from ..modules.permisos.router import router as permisos_router
from ..modules.autenticacion.dependencies import requerir_suscripcion_activa

api_router = APIRouter()

# --- Módulos abiertos (no requieren suscripción activa) ---
api_router.include_router(auth_router, prefix="/autenticacion", tags=["Autenticación"])
api_router.include_router(permisos_router, prefix="/permisos", tags=["Permisos"])

from ..modules.usuarios.routes import router as usuarios_router
api_router.include_router(usuarios_router, prefix="/usuarios", tags=["Usuarios"])

from ..modules.empresa_roles.routes import router as roles_router
api_router.include_router(roles_router, prefix="/roles", tags=["Roles"])

from ..modules.empresas.routes import router as empresas_router
api_router.include_router(empresas_router, prefix="/empresas", tags=["Empresas"])

from ..modules.configuracion.router import router as configuracion_router
api_router.include_router(configuracion_router, prefix="/configuracion", tags=["Configuración Global"])

from ..modules.suscripciones.routes import router as suscripciones_router
api_router.include_router(suscripciones_router, prefix="/suscripciones", tags=["Suscripciones y Planes"])

from ..modules.vendedores.routes import router as vendedores_router
api_router.include_router(vendedores_router, prefix="/vendedores", tags=["Vendedores"])

from ..modules.superadmin.routes import router as superadmin_router
api_router.include_router(superadmin_router, prefix="/superadmin", tags=["Súper Admin"])


# --- Módulos Operativos (bloqueados si la suscripción no es ACTIVA) ---
operativo = [Depends(requerir_suscripcion_activa)]

from ..modules.clientes.routes import router as clientes_router
api_router.include_router(clientes_router, prefix="/clientes", tags=["Clientes"], dependencies=operativo)

from ..modules.productos.router import router as productos_router
api_router.include_router(productos_router, prefix="/productos", tags=["Productos"], dependencies=operativo)

from ..modules.proveedores.router import router as proveedores_router
api_router.include_router(proveedores_router, prefix="/proveedores", tags=["Proveedores"], dependencies=operativo)

from ..modules.establecimientos.router import router as establecimientos_router
api_router.include_router(establecimientos_router, prefix="/establecimientos", tags=["Establecimientos"], dependencies=operativo)

from ..modules.puntos_emision.router import router as puntos_emision_router
api_router.include_router(puntos_emision_router, prefix="/puntos-emision", tags=["Puntos de Emisión"], dependencies=operativo)

from ..modules.formas_pago.router import router as formas_pago_router
api_router.include_router(formas_pago_router, prefix="/formas-pago", tags=["Formas de Pago"], dependencies=operativo)

from ..modules.facturas.router import router as facturas_router
api_router.include_router(facturas_router, prefix="/facturas", tags=["Facturas"], dependencies=operativo)

from ..modules.categorias_gasto.router import router as categorias_gasto_router
api_router.include_router(categorias_gasto_router, prefix="/categoria-gasto", tags=["Categorías de Gasto"], dependencies=operativo)

from ..modules.gastos.router import router as gastos_router
api_router.include_router(gastos_router, prefix="/gastos", tags=["Gastos"], dependencies=operativo)

from ..modules.cuentas_cobrar.router import router as cuentas_cobrar_router
api_router.include_router(cuentas_cobrar_router, prefix="/cuentas-cobrar", tags=["Cuentas por Cobrar"], dependencies=operativo)

from ..modules.cuentas_pagar.router import router as cuentas_pagar_router
api_router.include_router(cuentas_pagar_router, prefix="/cuentas-pagar", tags=["Cuentas por Pagar"], dependencies=operativo)

from ..modules.pagos_factura.router import router as pagos_factura_router
api_router.include_router(pagos_factura_router, prefix="/pagos-factura", tags=["Pagos de Facturas"], dependencies=operativo)

from ..modules.pagos_gasto.router import router as pagos_gasto_router
api_router.include_router(pagos_gasto_router, prefix="/pagos-gasto", tags=["Pagos de Gastos"], dependencies=operativo)

from ..modules.sri.router import router as sri_router
api_router.include_router(sri_router, prefix="/sri", tags=["SRI"], dependencies=operativo)

from ..modules.comisiones.router import router as comisiones_router
api_router.include_router(comisiones_router, prefix="/comisiones", tags=["Comisiones"], dependencies=operativo)

from ..modules.modulos.router import router as modulos_router
api_router.include_router(modulos_router, prefix="/modulos", tags=["Módulos SaaS"], dependencies=operativo)

from ..modules.dashboards.router import router as dashboards_router
api_router.include_router(dashboards_router, prefix="/dashboards", tags=["Dashboard"], dependencies=operativo)

from ..modules.reportes.router import router as reportes_router
api_router.include_router(reportes_router, prefix="/reportes", tags=["Reportes"], dependencies=operativo)

from ..modules.logs.router import router as logs_router
api_router.include_router(logs_router, prefix="/logs", tags=["Logs de Emisión"], dependencies=operativo)

from ..modules.inventarios.router import router as inventarios_router
api_router.include_router(inventarios_router, prefix="/inventarios", tags=["Inventarios"], dependencies=operativo)

from ..modules.programaciones.router import router as programaciones_router
api_router.include_router(programaciones_router, prefix="/programaciones", tags=["Facturación Programada"], dependencies=operativo)
