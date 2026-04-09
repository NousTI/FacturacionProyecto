from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioInventarios
from .schemas import MovimientoInventarioLectura, MovimientoInventarioCreacion
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.get("/", response_model=RespuestaBase[List[MovimientoInventarioLectura]])
def listar_todos(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarios = Depends()
):
    return success_response(servicio.listar_todos(usuario))

@router.get("/producto/{producto_id}", response_model=RespuestaBase[List[MovimientoInventarioLectura]])
def listar_por_producto(
    producto_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarios = Depends()
):
    return success_response(servicio.listar_por_producto(producto_id, usuario))

@router.get("/{id}", response_model=RespuestaBase[MovimientoInventarioLectura])
def obtener_movimiento(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarios = Depends()
):
    return success_response(servicio.obtener_movimiento(id, usuario))

@router.post("/", response_model=RespuestaBase[MovimientoInventarioLectura], status_code=status.HTTP_201_CREATED)
def crear_movimiento(
    datos: MovimientoInventarioCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_CREAR)),
    servicio: ServicioInventarios = Depends()
):
    return success_response(servicio.crear_movimiento(datos, usuario), "Movimiento registrado correctamente")

@router.put("/{id}", response_model=RespuestaBase[MovimientoInventarioLectura])
def actualizar_movimiento(
    id: UUID,
    datos: MovimientoInventarioCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_EDITAR)),
    servicio: ServicioInventarios = Depends()
):
    return success_response(servicio.actualizar_movimiento(id, datos, usuario), "Movimiento actualizado correctamente")

@router.delete("/{id}")
def eliminar_movimiento(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_ELIMINAR)),
    servicio: ServicioInventarios = Depends()
):
    servicio.eliminar_movimiento(id, usuario)
    return success_response(None, "Movimiento de inventario eliminado correctamente")
