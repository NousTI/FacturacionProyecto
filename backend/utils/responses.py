# backend/utils/responses.py

def error_response(code: int, message: str) -> dict:
    """
    Helper para respuestas de error consistentes.
    """
    return {"code": code, "message": message}

def success_response(data: dict) -> dict:
    """
    Helper para respuestas de éxito consistentes.
    """
    return {"data": data}
