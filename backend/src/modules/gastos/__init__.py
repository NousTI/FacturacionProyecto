from fastapi import APIRouter
from .gasto_router import router as gasto_router
from .pago_router import router as pago_router
from .categoria_router import router as categoria_router

router = APIRouter()

# Las rutas fijas (/pagos, /categorias) deben ir ANTES que las rutas con parámetros (/{id})
# para evitar que FastAPI las confunda con un UUID de gasto.
router.include_router(pago_router, prefix="/pagos", tags=["Pagos de Gastos"])
router.include_router(categoria_router, prefix="/categorias", tags=["Categorías de Gasto"])
router.include_router(gasto_router, tags=["Gastos"])
