from fastapi import APIRouter
from ..modules.autenticacion.router import router as auth_router
from ..modules.permisos.router import router as permisos_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/autenticacion", tags=["Autenticación"])
api_router.include_router(permisos_router, prefix="/permisos", tags=["Permisos"])

from ..modules.usuarios.router import router as usuarios_router
api_router.include_router(usuarios_router, prefix="/usuarios", tags=["Usuarios"])

from ..modules.roles.router import router as roles_router
api_router.include_router(roles_router, prefix="/roles", tags=["Roles"])

from ..modules.empresa.router import router as empresa_router
api_router.include_router(empresa_router, prefix="/empresas", tags=["Empresas"])

from ..modules.clientes.router import router as clientes_router
api_router.include_router(clientes_router, prefix="/clientes", tags=["Clientes"])

from ..modules.productos.router import router as productos_router
api_router.include_router(productos_router, prefix="/productos", tags=["Productos"])

from ..modules.proveedores.router import router as proveedores_router
api_router.include_router(proveedores_router, prefix="/proveedores", tags=["Proveedores"])

from ..modules.establecimientos.router import router as establecimientos_router
api_router.include_router(establecimientos_router, prefix="/establecimientos", tags=["Establecimientos"])

from ..modules.puntos_emision.router import router as puntos_emision_router
api_router.include_router(puntos_emision_router, prefix="/puntos-emision", tags=["Puntos de Emisión"])

from ..modules.formas_pago.router import router as formas_pago_router
api_router.include_router(formas_pago_router, prefix="/formas-pago", tags=["Formas de Pago"])

from ..modules.facturas.router import router as facturas_router
api_router.include_router(facturas_router, prefix="/facturas", tags=["Facturas"])

from ..modules.categorias_gasto.router import router as categorias_gasto_router
api_router.include_router(categorias_gasto_router, prefix="/categoria-gasto", tags=["Categorías de Gasto"])

from ..modules.gastos.router import router as gastos_router
api_router.include_router(gastos_router, prefix="/gastos", tags=["Gastos"])

from ..modules.cuentas_cobrar.router import router as cuentas_cobrar_router
api_router.include_router(cuentas_cobrar_router, prefix="/cuentas-cobrar", tags=["Cuentas por Cobrar"])

from ..modules.pagos_factura.router import router as pagos_factura_router
api_router.include_router(pagos_factura_router, prefix="/pagos-factura", tags=["Pagos de Facturas"])

from ..modules.pagos_gasto.router import router as pagos_gasto_router
api_router.include_router(pagos_gasto_router, prefix="/pagos-gasto", tags=["Pagos de Gastos"])

from ..modules.configuracion.router import router as configuracion_router
api_router.include_router(configuracion_router, prefix="/configuracion", tags=["Configuración Global"])

from ..modules.sri.router import router as sri_router
api_router.include_router(sri_router, prefix="/sri", tags=["SRI"])

from ..modules.comisiones.router import router as comisiones_router
api_router.include_router(comisiones_router, prefix="/comisiones", tags=["Comisiones"])

from ..modules.modulos.router import router as modulos_router
api_router.include_router(modulos_router, prefix="/modulos", tags=["Módulos SaaS"])

from ..modules.suscripciones.router import router as suscripciones_router
api_router.include_router(suscripciones_router, prefix="/suscripciones", tags=["Suscripciones y Planes"])

from ..modules.vendedores.router import router as vendedores_router
api_router.include_router(vendedores_router, prefix="/vendedores", tags=["Vendedores"])

from ..modules.dashboards.router import router as dashboards_router
api_router.include_router(dashboards_router, prefix="/dashboard", tags=["Dashboard"])

from ..modules.reportes.router import router as reportes_router
api_router.include_router(reportes_router, prefix="/reportes", tags=["Reportes"])

from ..modules.logs.router import router as logs_router
api_router.include_router(logs_router, prefix="/logs", tags=["Logs de Emisión"])

from ..modules.inventarios.router import router as inventarios_router
api_router.include_router(inventarios_router, prefix="/inventarios", tags=["Inventarios"])

from ..modules.programaciones.router import router as programaciones_router
api_router.include_router(programaciones_router, prefix="/programaciones", tags=["Facturación Programada"])

from ..modules.superadmin.router import router as superadmin_router
api_router.include_router(superadmin_router, prefix="/superadmin", tags=["Súper Admin"])
