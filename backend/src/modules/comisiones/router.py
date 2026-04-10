from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioComisiones
from .schemas import ComisionLectura, ComisionCreacion, ComisionActualizacion
from ..autenticacion.dependencies import get_current_user
from ...constants.enums import AuthKeys
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase
from ...errors.app_error import AppError

router = APIRouter()

def _obtener_usuario_comisiones(usuario: dict = Depends(get_current_user)):
    """Allow vendors/superadmins, or check permission for regular users"""
    if usuario.get(AuthKeys.IS_VENDEDOR) or usuario.get(AuthKeys.IS_SUPERADMIN):
        return usuario
    # Regular users need permission
    raise AppError("No tienes permisos suficientes para realizar esta acción", 403, code="PERM_001")

def _obtener_usuario_comisiones_write(usuario: dict = Depends(get_current_user)):
    """Allow vendors/superadmins, or check permission for regular users"""
    if usuario.get(AuthKeys.IS_VENDEDOR) or usuario.get(AuthKeys.IS_SUPERADMIN):
        return usuario
    # Regular users need permission
    raise AppError("No tienes permisos suficientes para realizar esta acción", 403, code="PERM_001")

@router.get("/", response_model=RespuestaBase[List[ComisionLectura]])
def listar_comisiones(
    usuario: dict = Depends(_obtener_usuario_comisiones),
    servicio: ServicioComisiones = Depends()
):
    resultado = servicio.listar_comisiones(usuario)
    return success_response(resultado)

@router.get("/stats")
def obtener_stats(
    usuario: dict = Depends(_obtener_usuario_comisiones),
    servicio: ServicioComisiones = Depends()
):
    resultado = servicio.obtener_stats(usuario)
    return success_response(resultado)

@router.get("/{id}", response_model=RespuestaBase[ComisionLectura])
def obtener_comision(
    id: UUID,
    usuario: dict = Depends(_obtener_usuario_comisiones),
    servicio: ServicioComisiones = Depends()
):
    resultado = servicio.obtener_comision(id, usuario)
    return success_response(resultado)

@router.get("/{id}/historial")
def obtener_historial(
    id: UUID,
    usuario: dict = Depends(_obtener_usuario_comisiones),
    servicio: ServicioComisiones = Depends()
):
    resultado = servicio.obtener_historial(id, usuario)
    return success_response(resultado)

@router.post("/", response_model=RespuestaBase[ComisionLectura], status_code=status.HTTP_201_CREATED)
def crear_comision(
    datos: ComisionCreacion,
    usuario: dict = Depends(_obtener_usuario_comisiones_write),
    servicio: ServicioComisiones = Depends()
):
    resultado = servicio.crear_manual(datos, usuario)
    return success_response(resultado, "Comisión manual creada")

@router.put("/{id}", response_model=RespuestaBase[ComisionLectura])
def actualizar_comision(
    id: UUID,
    datos: ComisionActualizacion,
    usuario: dict = Depends(_obtener_usuario_comisiones_write),
    servicio: ServicioComisiones = Depends()
):
    resultado = servicio.actualizar(id, datos, usuario)
    return success_response(resultado, "Comisión actualizada")

@router.delete("/{id}")
def eliminar_comision(
    id: UUID,
    usuario: dict = Depends(_obtener_usuario_comisiones_write),
    servicio: ServicioComisiones = Depends()
):
    servicio.eliminar(id, usuario)
    return success_response(None, "Comisión eliminada correctamente")
