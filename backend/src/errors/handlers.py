from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from .app_error import AppError
from ..constants.error_codes import ErrorCodes
from ..constants.messages import AppMessages
from ..utils.logger import logger

async def app_error_handler(request: Request, exc: AppError):
    # Log based on level
    log_msg = f"{exc.code} - {exc.message}"
    if exc.level == "ERROR":
        logger.error(log_msg)
    elif exc.level == "WARNING":
        logger.warning(log_msg)
    else:
        logger.info(log_msg)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "ok": False,
            "nivel": exc.level,
            "mensaje": exc.message,
            "codigo": exc.code,
            "descripcion": exc.description,
            "detalles": exc.details
        }
    )

async def validation_error_handler(request: Request, exc: RequestValidationError):
    errores = []
    for error in exc.errors():
        errores.append({
            "campo": ".".join(str(x) for x in error.get("loc", [])),
            "mensaje": error.get("msg")
        })
    
    logger.warning(f"{ErrorCodes.VAL_INVALID_INPUT} - Error de validación: {errores}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "ok": False,
            "nivel": "WARNING",
            "mensaje": AppMessages.VAL_INVALID_INPUT,
            "codigo": ErrorCodes.VAL_INVALID_INPUT,
            "descripcion": "La estructura de los datos enviados es incorrecta",
            "detalles": {"errores": errores}
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"{ErrorCodes.SYS_INTERNAL_ERROR} - Unhandled Exception: {str(exc)}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "ok": False,
            "nivel": "ERROR",
            "mensaje": AppMessages.SYS_INTERNAL_ERROR,
            "codigo": ErrorCodes.SYS_INTERNAL_ERROR,
            "descripcion": "Error interno no controlado",
            "detalles": {"error": str(exc)} # Ocultar en prod si se desea
        }
    )
