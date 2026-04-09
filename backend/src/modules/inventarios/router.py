from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .service import ServicioInventarios
from .schemas import MovimientoInventarioLectura, MovimientoInventarioCreacion, InventarioStats
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.get("/", response_model=RespuestaBase[List[MovimientoInventarioLectura]])
def listar_todos(
    producto_id: Optional[UUID] = None,
    tipo: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarios = Depends()
):
    filtros = {
        "producto_id": producto_id,
        "tipo": tipo,
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin
    }
    # Remove None values
    filtros = {k: v for k, v in filtros.items() if v is not None}
    return success_response(servicio.listar_todos(usuario, filtros))

@router.get("/stats", response_model=RespuestaBase[InventarioStats])
def obtener_stats(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarios = Depends()
):
    return success_response(servicio.obtener_stats(usuario))

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
