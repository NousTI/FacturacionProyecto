from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from .config.env import env
from .routes.api import api_router
from .middlewares.cors import add_cors_middleware
from .middlewares.error_middleware import ErrorMiddleware
from .errors.app_error import AppError
from .errors.handlers import app_error_handler, validation_error_handler, general_exception_handler
# from .modules.superadmin.automation import automation_service

app = FastAPI(
    title="Sistema de Facturación API",
    description="API para gestión de clientes, facturación e inventario",
    version="2.0.0",
    debug=env.DEBUG if 'env' in globals() else True
)

# 1. Middlewares
# Middleware de Errores Custom
app.add_middleware(ErrorMiddleware)

# CORS (Debe ser el último en agregarse para ser el primero en procesar y el último en responder)
add_cors_middleware(app)

# 2. Exception Handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, general_exception_handler)

# 3. Rutas
app.include_router(api_router, prefix="/api")

# 4. Eventos
@app.on_event("startup")
async def startup_event():
    import asyncio
    # asyncio.create_task(automation_service.start_daily_tasks())
    pass

@app.on_event("shutdown")
def shutdown_event():
    # automation_service.stop()
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)
