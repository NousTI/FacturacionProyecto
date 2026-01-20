from typing import Any, Optional
from datetime import datetime

def standard_response(
    ok: bool,
    mensaje: str,
    codigo: str,
    detalles: Optional[Any] = None
) -> dict:
    """
    Estructura base de respuesta:
    {
        "ok": bool,
        "mensaje": str,
        "codigo": str,
        "detalles": dict | list | None,
        "timestamp": str
    }
    """
    response = {
        "ok": ok,
        "mensaje": mensaje,
        "codigo": codigo,
        "detalles": detalles or {},
        "timestamp": datetime.now().isoformat() + "Z"
    }
    return response

def success_response(data: Any, mensaje: str = "Operación exitosa", codigo: str = "EXITO") -> dict:
    return standard_response(ok=True, mensaje=mensaje, codigo=codigo, detalles=data)

def error_response(mensaje: str, codigo: str = "ERROR", detalles: Optional[Any] = None) -> dict:
    return standard_response(ok=False, mensaje=mensaje, codigo=codigo, detalles=detalles)
