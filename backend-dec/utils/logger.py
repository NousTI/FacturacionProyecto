# backend/utils/logger.py
import logging
from typing import Optional

class CustomFormatter(logging.Formatter):
    """
    Formatter que permite incluir un código interno opcional.
    """
    def format(self, record):
        internal_code = getattr(record, 'internal_code', None)
        if internal_code:
            record.msg = f"[{internal_code}] {record.msg}"
        return super().format(record)

def get_logger(name: str):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        ch = logging.StreamHandler()
        # Formato: [Nivel] [Timestamp] Mensaje
        formatter = CustomFormatter('[%(levelname)s] %(asctime)s - %(message)s')
        ch.setFormatter(formatter)
        logger.addHandler(ch)

    return logger

def log_structured(logger: logging.Logger, level: str, code: str, message: str):
    """
    Helper para logs estructurados [LEVEL] [CODE] MESSAGE.
    """
    extra = {'internal_code': code}
    level = level.upper()
    if level == 'INFO':
        logger.info(message, extra=extra)
    elif level == 'WARNING' or level == 'WARN':
        logger.warning(message, extra=extra)
    elif level == 'ERROR':
        logger.error(message, extra=extra)
    elif level == 'SUCCESS':
        # Mapeamos SUCCESS a INFO para el logger estándar
        logger.info(f"[SUCCESS] {message}", extra={'internal_code': code})
