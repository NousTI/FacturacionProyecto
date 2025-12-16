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
from settings import get_settings
from utils.logger import get_logger
from utils.responses import error_response

settings = get_settings()

app = FastAPI(
    title="Sistema de Facturación API",
    description="API para gestión de clientes, facturación e inventario",
    version="1.0.0",
)

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

app.include_router(auth_router, prefix="/api/auth")
app.include_router(cliente_router, prefix="/api/clientes")
app.include_router(user_router, prefix="/api/usuarios")
app.include_router(proveedor_router, prefix="/api/proveedores")
app.include_router(producto_router, prefix="/api/productos")
app.include_router(superadmin_router)
app.include_router(vendedor_router, prefix="/api/vendedores", tags=["Vendedores"])
app.include_router(empresa_router, prefix="/api/empresas", tags=["Empresas"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
