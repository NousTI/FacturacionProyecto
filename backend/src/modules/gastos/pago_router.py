from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .pago_schemas import PagoGastoCreacion, PagoGastoLectura, PagoGastoActualizacion
from .pago_service import ServicioPagosGasto
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.get("", response_model=RespuestaBase[List[PagoGastoLectura]])
def listar_pagos(
    gasto_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PAGO_GASTO_VER)),
    servicio: ServicioPagosGasto = Depends()
):
    return success_response(servicio.listar_pagos(gasto_id, usuario))

@router.post("", response_model=RespuestaBase[PagoGastoLectura], status_code=status.HTTP_201_CREATED)
def crear_pago(
    datos: PagoGastoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PAGO_GASTO_CREAR)),
    servicio: ServicioPagosGasto = Depends()
):
    return success_response(servicio.crear_pago(datos, usuario), "Pago registrado correctamente")

@router.put("/{id}", response_model=RespuestaBase[PagoGastoLectura])
def actualizar_pago(
    id: UUID,
    datos: PagoGastoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PAGO_GASTO_EDITAR)),
    servicio: ServicioPagosGasto = Depends()
):
    return success_response(servicio.actualizar_pago(id, datos, usuario), "Pago actualizado correctamente")

@router.delete("/{id}")
def eliminar_pago(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PAGO_GASTO_ELIMINAR)),
    servicio: ServicioPagosGasto = Depends()
):
    servicio.eliminar_pago(id, usuario)
    return success_response(None, "Pago eliminado correctamente")
