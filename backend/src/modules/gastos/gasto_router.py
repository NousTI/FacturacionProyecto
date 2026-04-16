from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .gasto_service import ServicioGastos
from .gasto_schemas import GastoLectura, GastoCreacion, GastoActualizacion
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.get("/", response_model=RespuestaBase[List[GastoLectura]])
def listar_gastos(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso([PermissionCodes.GESTIONAR_GASTOS, PermissionCodes.GESTIONAR_PAGOS])),
    servicio: ServicioGastos = Depends()
):
    return success_response(servicio.listar_gastos(usuario, empresa_id))

@router.post("/", response_model=RespuestaBase[GastoLectura], status_code=status.HTTP_201_CREATED)
def crear_gasto(
    datos: GastoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.GESTIONAR_GASTOS)),
    servicio: ServicioGastos = Depends()
):
    return success_response(servicio.crear_gasto(datos, usuario), "Gasto registrado correctamente")

@router.get("/{id}", response_model=RespuestaBase[GastoLectura])
def obtener_gasto(
    id: UUID,
    usuario: dict = Depends(requerir_permiso([PermissionCodes.GESTIONAR_GASTOS, PermissionCodes.GESTIONAR_PAGOS])),
    servicio: ServicioGastos = Depends()
):
    return success_response(servicio.obtener_gasto(id, usuario))

@router.put("/{id}", response_model=RespuestaBase[GastoLectura])
def actualizar_gasto(
    id: UUID,
    datos: GastoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.GESTIONAR_GASTOS)),
    servicio: ServicioGastos = Depends()
):
    return success_response(servicio.actualizar_gasto(id, datos, usuario), "Gasto actualizado correctamente")

@router.delete("/{id}")
def eliminar_gasto(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.GESTIONAR_GASTOS)),
    servicio: ServicioGastos = Depends()
):
    servicio.eliminar_gasto(id, usuario)
    return success_response(None, "Gasto eliminado correctamente")
