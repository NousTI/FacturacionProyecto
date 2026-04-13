from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from .config.env import env
from .routes.api import api_router
from .middlewares.cors import add_cors_middleware
from .middlewares.error_middleware import ErrorMiddleware
from .errors.app_error import AppError
from .errors.handlers import app_error_handler, validation_error_handler, general_exception_handler
from .modules.superadmin.automation import automation_service
from .jobs.session_cleanup import cleanup_expired_sessions

app = FastAPI(
    title="Sistema de Facturación API",
    description="API para gestión de clientes y facturación",
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

# Directorio de reportes estáticos
import os
os.makedirs("static/reportes", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 4. Eventos
@app.on_event("startup")
async def startup_event():
    import asyncio
    # Ejecutar tareas diarias automatizadas
    asyncio.create_task(automation_service.start_daily_tasks())
    # Ejecutar limpieza de sesiones al inicio de forma asíncrona
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, cleanup_expired_sessions)
    pass

@app.on_event("shutdown")
def shutdown_event():
    automation_service.stop()
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)
