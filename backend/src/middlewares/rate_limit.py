from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from ..config.env import env

# Inicializar el limitador global usando la IP del cliente
limiter = Limiter(key_func=get_remote_address)

def setup_rate_limit(app):
    """
    Configura el limitador de peticiones en la aplicación FastAPI.
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Decorador pre-configurado para login
login_rate_limit = limiter.limit(env.RATE_LIMIT_LOGIN)
