import logging
import sys
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
        ch = logging.StreamHandler(sys.stdout)
        # Formato: [Nivel] [Timestamp] Mensaje
        formatter = CustomFormatter('[%(levelname)s] %(asctime)s - %(message)s')
        ch.setFormatter(formatter)
        logger.addHandler(ch)

    return logger
