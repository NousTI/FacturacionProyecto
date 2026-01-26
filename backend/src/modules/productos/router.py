from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .schemas import ProductoCreacion, ProductoLectura, ProductoActualizacion
from .service import ServicioProductos
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()

@router.get("/", response_model=List[ProductoLectura])
def listar_productos(
    nombre: Optional[str] = None, 
    codigo: Optional[str] = None, 
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTO_VER)),
    servicio: ServicioProductos = Depends()
):
    return servicio.listar_productos(usuario, nombre, codigo)

@router.get("/{producto_id}", response_model=ProductoLectura)
def obtener_producto(
    producto_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTO_VER)), 
    servicio: ServicioProductos = Depends()
):
    return servicio.obtener_producto(producto_id, usuario)

@router.post("/", response_model=ProductoLectura, status_code=status.HTTP_201_CREATED)
def crear_producto(
    datos: ProductoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTO_CREAR)),
    servicio: ServicioProductos = Depends()
):
    return servicio.crear_producto(datos, usuario)

@router.put("/{producto_id}", response_model=ProductoLectura)
def actualizar_producto(
    producto_id: UUID,
    datos: ProductoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTO_EDITAR)),
    servicio: ServicioProductos = Depends()
):
    return servicio.actualizar_producto(producto_id, datos, usuario)

@router.delete("/{producto_id}")
def eliminar_producto(
    producto_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTO_ELIMINAR)),
    servicio: ServicioProductos = Depends()
):
    servicio.eliminar_producto(producto_id, usuario)
    return success_response(None, "Producto eliminado correctamente")
