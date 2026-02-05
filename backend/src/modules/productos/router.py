from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .schemas import ProductoCreacion, ProductoLectura, ProductoActualizacion
from .service import ServicioProductos
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.get("/", response_model=RespuestaBase[List[ProductoLectura]])
def listar_productos(
    nombre: Optional[str] = None, 
    codigo: Optional[str] = None, 
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTOS_VER)),
    servicio: ServicioProductos = Depends()
):
    productos = servicio.listar_productos(usuario, nombre, codigo)
    return success_response(productos, "Productos listados correctamente")

@router.get("/{producto_id}", response_model=RespuestaBase[ProductoLectura])
def obtener_producto(
    producto_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTOS_VER)), 
    servicio: ServicioProductos = Depends()
):
    producto = servicio.obtener_producto(producto_id, usuario)
    return success_response(producto, "Producto obtenido correctamente")

@router.post("/", response_model=RespuestaBase[ProductoLectura], status_code=status.HTTP_201_CREATED)
def crear_producto(
    datos: ProductoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTOS_CREAR)),
    servicio: ServicioProductos = Depends()
):
    producto = servicio.crear_producto(datos, usuario)
    return success_response(producto, "Producto creado correctamente")

@router.put("/{producto_id}", response_model=RespuestaBase[ProductoLectura])
def actualizar_producto(
    producto_id: UUID,
    datos: ProductoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTOS_EDITAR)),
    servicio: ServicioProductos = Depends()
):
    producto = servicio.actualizar_producto(producto_id, datos, usuario)
    return success_response(producto, "Producto actualizado correctamente")

@router.delete("/{producto_id}", response_model=RespuestaBase)
def eliminar_producto(
    producto_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTOS_ELIMINAR)),
    servicio: ServicioProductos = Depends()
):
    servicio.eliminar_producto(producto_id, usuario)
    return success_response(None, "Producto eliminado correctamente")
