from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .schemas import ProductoCreacion, ProductoLectura, ProductoActualizacion, ProductoMasVendido, ProductoSinMovimiento, ProductoRentabilidad, ProductoReporteInventario, ProductoKardexItem
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
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso([PermissionCodes.PRODUCTOS_VER, PermissionCodes.FACTURAS_CREAR, PermissionCodes.FACTURAS_EDITAR, PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS, PermissionCodes.FACTURA_PROGRAMADA_CREAR, PermissionCodes.FACTURA_PROGRAMADA_EDITAR])),
    servicio: ServicioProductos = Depends()
):
    productos = servicio.listar_productos(usuario, nombre, codigo, empresa_id)
    return success_response(productos, "Productos listados correctamente")

@router.get("/analiticas/mas-vendidos", response_model=RespuestaBase[List[ProductoMasVendido]])
def obtener_mas_vendidos(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    limit: int = 10,
    criterio: str = 'cantidad',
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTOS_VER)),
    servicio: ServicioProductos = Depends()
):
    data = servicio.obtener_productos_mas_vendidos(usuario, fecha_inicio, fecha_fin, limit, criterio)
    return success_response(data, "Ranking obtenido")

@router.get("/analiticas/sin-movimiento", response_model=RespuestaBase[List[ProductoSinMovimiento]])
def obtener_sin_movimiento(
    dias: int = 30,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTOS_VER)),
    servicio: ServicioProductos = Depends()
):
    data = servicio.obtener_productos_sin_movimiento(usuario, dias)
    return success_response(data, "Productos sin movimiento")

@router.get("/analiticas/rentabilidad", response_model=RespuestaBase[List[ProductoRentabilidad]])
def obtener_rentabilidad(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTOS_VER)),
    servicio: ServicioProductos = Depends()
):
    data = servicio.obtener_rentabilidad_productos(usuario)
    return success_response(data, "Análisis de rentabilidad obtenido")

@router.get("/analiticas/reporte-inventario", response_model=RespuestaBase[List[ProductoReporteInventario]])
def obtener_reporte_inventario(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTOS_VER)),
    servicio: ServicioProductos = Depends()
):
    data = servicio.obtener_reporte_inventario(usuario)
    return success_response(data, "Reporte de inventario obtenido")

@router.get("/{producto_id}/kardex", response_model=RespuestaBase[List[ProductoKardexItem]])
def obtener_kardex(
    producto_id: UUID,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PRODUCTOS_VER)),
    servicio: ServicioProductos = Depends()
):
    data = servicio.obtener_kardex_producto(producto_id, usuario, fecha_inicio, fecha_fin)
    return success_response(data, "Kardex obtenido")

@router.get("/{producto_id}", response_model=RespuestaBase[ProductoLectura])
def obtener_producto(
    producto_id: UUID,
    usuario: dict = Depends(requerir_permiso([PermissionCodes.PRODUCTOS_VER, PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS, PermissionCodes.FACTURAS_CREAR, PermissionCodes.FACTURAS_EDITAR])), 
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
