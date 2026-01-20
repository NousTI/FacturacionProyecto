from typing import Any, Dict, Optional

class AppError(Exception):
    """
    Excepción base para errores controlados de la aplicación.
    """
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        code: str = "APP_ERROR",
        description: str = None,
        level: str = "ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.description = description
        self.level = level
        self.details = details or {}
