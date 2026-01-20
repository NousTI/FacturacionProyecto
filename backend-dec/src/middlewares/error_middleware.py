import uuid
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from ..utils.logger import get_logger
from ..errors.app_error import AppError

logger = get_logger("middleware")

class ErrorMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        request.state.request_id = request_id
        
        # Contexto para logs
        ctx = {
            "path": request.url.path,
            "method": request.method,
            "request_id": request_id
        }

        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as e:
            # Si es AppError, dejarlo pasar para que lo maneje el exception handler?
            # O manejarlo aquí si queremos logging específico de middleware.
            # FastAPI exception handlers corren *después* del middleware si el middleware deja pasar la excepción?
            # BaseHTTPMiddleware atrapa todo. Debemos relanzar o manejar.
            # Para usar los handlers de FastAPI, lo mejor es NO atrapar aquí las excepciones controladas,
            # o atraparlas y devolver JSONResponse directos.
            
            # Sin embargo, el código original hacía su propio handling.
            # Vamos a dejar pasar las excepciones para que los handlers globales ("exception_handlers=...") de FastAPI actúen,
            # PERO logueamos aquí si queremos.
            
            # El código original atrapaba y devolvía JSONResponse.
            # Reproduciremos ese comportamiento para consistencia, pero usando nuestra estructura.
            
            logger.error(f"Error en request {ctx}: {str(e)}")
            
            if isinstance(e, AppError):
                 return JSONResponse(
                    status_code=e.status_code,
                    content={
                        "ok": False,
                        "mensaje": e.message,
                        "codigo": e.code,
                        "detalles": e.details
                    },
                    headers={"X-Request-ID": request_id}
                )
            
            # Error no controlado
            return JSONResponse(
                status_code=500,
                content={
                    "ok": False,
                    "mensaje": "Error interno del servidor",
                    "codigo": "INTERNAL_ERROR",
                    "detalles": {"original_error": str(e)} # TODO: Ocultar en prod
                },
                headers={"X-Request-ID": request_id}
            )
