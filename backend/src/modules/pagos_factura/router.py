from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from .schemas import PagoFacturaCreacion, PagoFacturaLectura
from .service import ServicioPagosFactura
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()

@router.post("/", response_model=PagoFacturaLectura, status_code=status.HTTP_201_CREATED)
def crear_pago(
    datos: PagoFacturaCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PAGO_CREAR)),
    servicio: ServicioPagosFactura = Depends()
):
    return servicio.crear_pago(datos, usuario)

@router.get("/", response_model=List[PagoFacturaLectura])
def listar_pagos(
    cuenta_cobrar_id: Optional[UUID] = Query(None),
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PAGO_VER)),
    servicio: ServicioPagosFactura = Depends()
):
    return servicio.listar_pagos(cuenta_cobrar_id, usuario, limit, offset)

@router.get("/{id}", response_model=PagoFacturaLectura)
def obtener_pago(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PAGO_VER)),
    servicio: ServicioPagosFactura = Depends()
):
    return servicio.obtener_pago(id, usuario)
