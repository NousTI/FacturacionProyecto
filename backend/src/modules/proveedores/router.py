from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .schemas import ProveedorCreacion, ProveedorLectura, ProveedorActualizacion
from .service import ServicioProveedores
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.get("/", response_model=RespuestaBase[List[ProveedorLectura]])
def listar_proveedores(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_VER)),
    servicio: ServicioProveedores = Depends()
):
    return success_response(servicio.listar_proveedores(usuario, empresa_id_filtro=empresa_id))

@router.get("/{proveedor_id}", response_model=RespuestaBase[ProveedorLectura])
def obtener_proveedor(
    proveedor_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_VER)),
    servicio: ServicioProveedores = Depends()
):
    return success_response(servicio.obtener_proveedor(proveedor_id, usuario))

@router.post("/", response_model=RespuestaBase[ProveedorLectura], status_code=status.HTTP_201_CREATED)
def crear_proveedor(
    datos: ProveedorCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_CREAR)),
    servicio: ServicioProveedores = Depends()
):
    return success_response(servicio.crear_proveedor(datos, usuario), "Proveedor creado correctamente")

@router.patch("/{proveedor_id}", response_model=RespuestaBase[ProveedorLectura])
def actualizar_proveedor(
    proveedor_id: UUID,
    datos: ProveedorActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_EDITAR)),
    servicio: ServicioProveedores = Depends()
):
    return success_response(servicio.actualizar_proveedor(proveedor_id, datos, usuario), "Proveedor actualizado correctamente")

@router.delete("/{proveedor_id}")
def eliminar_proveedor(
    proveedor_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_ELIMINAR)),
    servicio: ServicioProveedores = Depends()
):
    servicio.eliminar_proveedor(proveedor_id, usuario)
    return success_response(None, "Proveedor eliminado correctamente")

@router.patch("/{proveedor_id}/toggle-activo", response_model=RespuestaBase[ProveedorLectura])
def toggle_activo_proveedor(
    proveedor_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_EDITAR)),
    servicio: ServicioProveedores = Depends()
):
    return success_response(servicio.toggle_activo(proveedor_id, usuario), "Estado del proveedor actualizado")
