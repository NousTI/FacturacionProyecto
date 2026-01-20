import logging
import sys
from colorama import init, Fore, Style

# Initialize colorama
init(autoreset=True)

class ColoredFormatter(logging.Formatter):
    """
    Formatter para agregar colores a los logs dependiendo del nivel.
    """
    COLORS = {
        logging.DEBUG: Fore.CYAN,
        logging.INFO: Fore.GREEN,
        logging.WARNING: Fore.YELLOW,
        logging.ERROR: Fore.RED,
        logging.CRITICAL: Fore.RED + Style.BRIGHT,
    }

    def format(self, record):
        # Save original levelname to restore it after formatting? 
        # Actually modifying record directly might affect other handlers if they existed, 
        # but here we are setting up our own.
        
        levelname = record.levelname
        color = self.COLORS.get(record.levelno, Fore.WHITE)
        
        # Format: [LEVEL] Message
        # We inject color codes into the string
        record.levelname = f"{color}{levelname}{Style.RESET_ALL}"
        record.msg = f"{color}{record.msg}{Style.RESET_ALL}"
        
        return super().format(record)

def setup_logger():
    logger = logging.getLogger("facturacion_api")
    logger.setLevel(logging.INFO)
    logger.propagate = False # Prevent double logging if root logger is used

    # Clear existing handlers to prevent duplicates on reload
    if logger.handlers:
        logger.handlers.clear()

    # Console Handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    
    # Format: [LEVEL] Message
    formatter = ColoredFormatter("[%(levelname)s] %(message)s")
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    
    return logger

logger = setup_logger()

def get_logger(name: str):
    """
    Retorna un sub-logger con el prefijo 'facturacion_api.'
    """
    return logging.getLogger(f"facturacion_api.{name}")
