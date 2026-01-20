from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from .app_error import AppError

async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "ok": False,
            "mensaje": exc.message,
            "codigo": exc.code,
            "detalles": exc.details
        }
    )

async def validation_error_handler(request: Request, exc: RequestValidationError):
    """
    Maneja errores de validación de Pydantic/FastAPI.
    """
    errores = []
    for error in exc.errors():
        errores.append({
            "campo": ".".join(str(x) for x in error.get("loc", [])),
            "mensaje": error.get("msg")
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "ok": False,
            "mensaje": "Error de validación en los datos enviados",
            "codigo": "VALIDATION_ERROR",
            "detalles": {"errores": errores}
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """
    Maneja cualquier otra excepción no controlada (500).
    """
    # Aquí podrías agregar logs más detallados
    print(f"Unhandled Error: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "ok": False,
            "mensaje": "Error interno del servidor",
            "codigo": "INTERNAL_ERROR",
            "detalles": {"error": str(exc)} # Ocultar en producción real si se desea
        }
    )
