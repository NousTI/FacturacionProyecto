from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from .config.env import env
from .routes.api import api_router
from .middlewares.cors import add_cors_middleware
from .middlewares.error_middleware import ErrorMiddleware
from .errors.app_error import AppError
from .errors.handlers import app_error_handler, validation_error_handler, general_exception_handler

# Importación Legacy para tareas en segundo plano
# Si falla el import, comentar temporalmente
try:
    from services.automation_service import automation_service
    import asyncio
    HAS_AUTOMATION = True
except ImportError:
    HAS_AUTOMATION = False

app = FastAPI(
    title="Sistema de Facturación API",
    description="API para gestión de clientes, facturación e inventario",
    version="2.0.0",
    debug=env.DEBUG
)

# 1. Middlewares
# CORS
add_cors_middleware(app)

# Middleware de Errores Custom
app.add_middleware(ErrorMiddleware)

# 2. Exception Handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, general_exception_handler)

# 3. Rutas
app.include_router(api_router, prefix="/api")

# 4. Eventos
@app.on_event("startup")
async def startup_event():
    if HAS_AUTOMATION:
        asyncio.create_task(automation_service.start_daily_tasks())

@app.on_event("shutdown")
def shutdown_event():
    if HAS_AUTOMATION:
        automation_service.stop()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)
