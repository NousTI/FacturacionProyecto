from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .schemas import GastoCreacion, GastoLectura, GastoActualizacion
from .service import ServicioGastos
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()

@router.get("/", response_model=List[GastoLectura])
def listar_gastos(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioGastos = Depends()
):
    return servicio.listar_gastos(usuario, empresa_id)

@router.post("/", response_model=GastoLectura, status_code=status.HTTP_201_CREATED)
def crear_gasto(
    datos: GastoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioGastos = Depends()
):
    return servicio.crear_gasto(datos, usuario)

@router.get("/{id}", response_model=GastoLectura)
def obtener_gasto(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioGastos = Depends()
):
    return servicio.obtener_gasto(id, usuario)

@router.put("/{id}", response_model=GastoLectura)
def actualizar_gasto(
    id: UUID,
    datos: GastoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioGastos = Depends()
):
    return servicio.actualizar_gasto(id, datos, usuario)

@router.delete("/{id}")
def eliminar_gasto(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioGastos = Depends()
):
    servicio.eliminar_gasto(id, usuario)
    return success_response(None, "Gasto eliminado correctamente")
