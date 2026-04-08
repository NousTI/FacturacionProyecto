"""
Router de Facturas Modificado.

Centraliza la inclusión de todos los sub-routers de facturación.
"""

from fastapi import APIRouter

from .routers.router_factura import router as router_factura
from .routers.router_sri import router as router_sri
from .routers.router_detalles import router as router_detalles
from .routers.router_pagos import router as router_pagos
from .routers.router_recurrentes import router as router_recurrentes

router = APIRouter()

# Incluir sub-routers
router.include_router(router_factura, tags=["Facturas"])
router.include_router(router_sri, tags=["Facturas SRI"])
router.include_router(router_detalles, tags=["Facturas Detalles"])
router.include_router(router_pagos, tags=["Facturas Pagos"])
router.include_router(router_recurrentes, prefix="/programacion", tags=["Facturación Programada"])
