# backend/main.py

import uuid
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes.cliente_routes import router as cliente_router
from api.routes.auth_router import router as auth_router
from api.routes.usuarios_routes import router as user_router
from api.routes.proveedor_routes import router as proveedor_router
from api.routes.producto_routes import router as producto_router
from api.routes.superadmin_routes import router as superadmin_router
from api.routes.vendedor_routes import router as vendedor_router
from api.routes.empresa_routes import router as empresa_router
from api.routes.plan_routes import router as plan_router
from api.routes.suscripcion_routes import router as suscripcion_router
from api.routes.comision_routes import router as comision_router
from api.routes.rol_routes import router as rol_router
from api.routes.permiso_routes import router as permiso_router
from api.routes.facturacion_programada_routes import router as facturacion_programada_router
from settings import get_settings
from utils.logger import get_logger
from utils.responses import error_response
from services.automation_service import automation_service
import asyncio

settings = get_settings()

app = FastAPI(
    title="Sistema de Facturación API",
    description="API para gestión de clientes, facturación e inventario",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    # Start automation tasks in the background
    asyncio.create_task(automation_service.start_daily_tasks())

@app.on_event("shutdown")
def shutdown_event():
    automation_service.stop()

logger = get_logger("api")


def _request_context(request: Request):
    """Extrae contexto básico del request para logs."""
    payload = getattr(request.state, "jwt_payload", None)
    user_id = None
    if isinstance(payload, dict):
        user_id = payload.get("sub")
    return {
        "path": request.url.path,
        "method": request.method,
        "user_id": user_id,
        "request_id": getattr(request.state, "request_id", None),
    }


@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    """
    Captura errores y devuelve respuestas consistentes {code, message},
    registrando contexto (path, method, user_id, request_id).
    """
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    request.state.request_id = request_id
    ctx = _request_context(request)
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    except HTTPException as exc:
        if isinstance(exc.detail, dict):
            message = exc.detail.get("message", "Error en la solicitud")
            code = exc.detail.get("code", exc.status_code)
        else:
            message = exc.detail if isinstance(exc.detail, str) else "Error en la solicitud"
            code = exc.status_code
        logger.warning(
            "HTTPException %s %s user=%s rid=%s: %s",
            ctx["method"],
            ctx["path"],
            ctx["user_id"],
            ctx["request_id"],
            message,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(code, message),
            headers={"X-Request-ID": request_id},
        )
    except Exception:
        logger.exception(
            "Unhandled error %s %s user=%s rid=%s",
            ctx["method"],
            ctx["path"],
            ctx["user_id"],
            ctx["request_id"],
        )
        return JSONResponse(
            status_code=500,
            content=error_response(500, "Error interno del servidor"),
            headers={"X-Request-ID": request_id},
        )


origins = settings.allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.routes.establecimiento_routes import router as establecimiento_router

from api.routes.punto_emision_routes import router as punto_emision_router
from api.routes.cuenta_cobrar_routes import router as cuenta_cobrar_router
from api.routes.pago_factura_routes import router as pago_factura_router
from api.routes.log_emision_routes import router as log_emision_router
from api.routes.reporte_generado_routes import router as reporte_generado_router
from api.routes.sri_routes import router as sri_router
from api.routes.configuracion_sri_routes import router as configuracion_sri_router
from api.routes.modulo_routes import router as modulo_router
from api.routes.factura_routes import router as factura_router
from api.routes.factura_detalle_routes import router as factura_detalle_router

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

# App Include
# App Include
app.include_router(auth_router, prefix="/api/auth")
app.include_router(cliente_router, prefix="/api/clientes")
app.include_router(user_router, prefix="/api/usuarios")
app.include_router(proveedor_router, prefix="/api/proveedores")
app.include_router(producto_router, prefix="/api/productos")
app.include_router(superadmin_router)
app.include_router(vendedor_router, prefix="/api/vendedores", tags=["Vendedores"])
app.include_router(empresa_router, prefix="/api/empresas", tags=["Empresas"])
app.include_router(plan_router, prefix="/api/planes", tags=["Planes"])
app.include_router(suscripcion_router, prefix="/api/suscripciones", tags=["Suscripciones"])
app.include_router(comision_router, prefix="/api/comisiones", tags=["Comisiones"])
app.include_router(rol_router, prefix="/api/roles", tags=["Roles"])
app.include_router(permiso_router, prefix="/api/permisos", tags=["Permisos"])
app.include_router(factura_router, prefix="/api/facturas", tags=["Facturas"])
app.include_router(factura_detalle_router, prefix="/api/facturas-detalle", tags=["Factura Detalle"])
app.include_router(facturacion_programada_router, prefix="/api/facturacion-programada", tags=["Facturación Programada"])
app.include_router(establecimiento_router, prefix="/api/establecimientos", tags=["Establecimientos"])
app.include_router(punto_emision_router, prefix="/api/puntos-emision", tags=["Puntos de Emisión"])
app.include_router(cuenta_cobrar_router, prefix="/api/cuentas-cobrar", tags=["Cuentas por Cobrar"])
app.include_router(pago_factura_router, prefix="/api/pagos-factura", tags=["Pagos Factura"])
app.include_router(log_emision_router, prefix="/api/logs-emision", tags=["Logs Emisión"])
app.include_router(reporte_generado_router, prefix="/api/reportes-generados", tags=["Reportes Generados"])
app.include_router(sri_router, prefix="/api/sri", tags=["SRI"])
app.include_router(configuracion_sri_router, prefix="/api/configuracion-sri", tags=["Configuración SRI"])
app.include_router(modulo_router, tags=["Módulos"])

from api.routes.dashboard_routes import router as dashboard_router
app.include_router(dashboard_router)

from api.routes.forma_pago_routes import router as forma_pago_router
app.include_router(forma_pago_router, prefix="/api", tags=["Forma Pago"])

from api.routes.categoria_gasto_routes import router as categoria_gasto_router
app.include_router(categoria_gasto_router, prefix="/api", tags=["Categoria Gasto"])

from api.routes.gasto_routes import router as gasto_router
app.include_router(gasto_router, prefix="/api", tags=["Gasto"])

from api.routes.pago_gasto_routes import router as pago_gasto_router
app.include_router(pago_gasto_router, prefix="/api", tags=["Pago Gasto"])

from api.routes.movimiento_inventario_routes import router as movimiento_inventario_router
app.include_router(movimiento_inventario_router, prefix="/api", tags=["Movimiento Inventario"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
