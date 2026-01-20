from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .schemas import PagoGastoCreacion, PagoGastoLectura, PagoGastoActualizacion
from .service import ServicioPagosGasto
from ..autenticacion.dependencies import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()

@router.get("/", response_model=List[PagoGastoLectura])
def listar_pagos(
    gasto_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioPagosGasto = Depends()
):
    return servicio.listar_pagos(gasto_id, usuario)

@router.post("/", response_model=PagoGastoLectura, status_code=status.HTTP_201_CREATED)
def crear_pago(
    datos: PagoGastoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioPagosGasto = Depends()
):
    return servicio.crear_pago(datos, usuario)

@router.put("/{id}", response_model=PagoGastoLectura)
def actualizar_pago(
    id: UUID,
    datos: PagoGastoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioPagosGasto = Depends()
):
    return servicio.actualizar_pago(id, datos, usuario)

@router.delete("/{id}")
def eliminar_pago(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioPagosGasto = Depends()
):
    servicio.eliminar_pago(id, usuario)
    return success_response(None, "Pago eliminado correctamente")
