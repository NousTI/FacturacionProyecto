from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioInventarios
from .schemas import MovimientoInventarioLectura, MovimientoInventarioCreacion
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes

router = APIRouter()

@router.get("/", response_model=List[MovimientoInventarioLectura])
def listar_todos(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTO_EDITAR)),
    servicio: ServicioInventarios = Depends()
):
    return servicio.listar_todos(usuario)

@router.get("/producto/{producto_id}", response_model=List[MovimientoInventarioLectura])
def listar_por_producto(
    producto_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTO_EDITAR)),
    servicio: ServicioInventarios = Depends()
):
    return servicio.listar_por_producto(producto_id, usuario)

@router.post("/", response_model=MovimientoInventarioLectura, status_code=status.HTTP_201_CREATED)
def crear_movimiento(
    datos: MovimientoInventarioCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTO_EDITAR)),
    servicio: ServicioInventarios = Depends()
):
    return servicio.crear_movimiento(datos, usuario)
