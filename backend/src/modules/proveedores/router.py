from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .schemas import ProveedorCreacion, ProveedorLectura, ProveedorActualizacion
from .service import ServicioProveedores
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()

@router.get("/", response_model=List[ProveedorLectura])
def listar_proveedores(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_VER)),
    servicio: ServicioProveedores = Depends()
):
    return servicio.listar_proveedores(usuario, empresa_id)

@router.get("/{proveedor_id}", response_model=ProveedorLectura)
def obtener_proveedor(
    proveedor_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_VER)),
    servicio: ServicioProveedores = Depends()
):
    return servicio.obtener_proveedor(proveedor_id, usuario)

@router.post("/", response_model=ProveedorLectura, status_code=status.HTTP_201_CREATED)
def crear_proveedor(
    datos: ProveedorCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_CREAR)),
    servicio: ServicioProveedores = Depends()
):
    return servicio.crear_proveedor(datos, usuario)

@router.put("/{proveedor_id}", response_model=ProveedorLectura)
def actualizar_proveedor(
    proveedor_id: UUID,
    datos: ProveedorActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_EDITAR)),
    servicio: ServicioProveedores = Depends()
):
    return servicio.actualizar_proveedor(proveedor_id, datos, usuario)

@router.delete("/{proveedor_id}")
def eliminar_proveedor(
    proveedor_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PROVEEDOR_ELIMINAR)),
    servicio: ServicioProveedores = Depends()
):
    servicio.eliminar_proveedor(proveedor_id, usuario)
    return success_response(None, "Proveedor eliminado correctamente")
