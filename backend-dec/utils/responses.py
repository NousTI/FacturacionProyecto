# backend/utils/responses.py
from datetime import datetime
from typing import Optional, Any

def standard_response(
    status: str, 
    code: str, 
    message: str, 
    details: Optional[Any] = None
) -> dict:
    """
    Helper base para respuestas estandarizadas.
    """
    response = {
        "status": status,
        "code": str(code),
        "message": message,
        "timestamp": datetime.now().isoformat() + "Z"
    }
    if details is not None:
        response["details"] = details
    return response

def error_response(code: Any, message: str, details: Optional[Any] = None) -> dict:
    """
    Helper para respuestas de error consistentes.
    """
    return standard_response("error", code, message, details)

def success_response(data: Any, message: str = "Operación exitosa", code: str = "SUCCESS") -> dict:
    """
    Helper para respuestas de éxito consistentes.
    Envolvemos el data anterior en el campo 'details' o lo mantenemos si es necesario.
    """
    return standard_response("success", code, message, details=data)

def info_response(message: str, code: str = "INFO", details: Optional[Any] = None) -> dict:
    """
    Helper para mensajes informativos.
    """
    return standard_response("info", code, message, details)

def warning_response(message: str, code: str = "WARNING", details: Optional[Any] = None) -> dict:
    """
    Helper para advertencias.
    """
    return standard_response("warning", code, message, details)
