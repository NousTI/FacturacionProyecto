from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .service import ServicioInventarios
from .inventario_service import ServicioInventarioStock
from .schemas import (
    MovimientoInventarioLectura, MovimientoInventarioCreacion, InventarioStats,
    InventarioLectura, InventarioCreacion, InventarioActualizacion, InventarioResumen
)
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

# --- Stock Management Routes (Gestión de Inventario) - MUST BE BEFORE /{id} ---
@router.get("/stock/resumen", response_model=RespuestaBase[List[InventarioResumen]])
def obtener_resumen_stock(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarioStock = Depends()
):
    """Obtener resumen de stock por estado para todos los productos"""
    return success_response(servicio.obtener_stock_resumen(usuario))


@router.get("/stock/", response_model=RespuestaBase[List[InventarioLectura]])
def listar_inventario(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarioStock = Depends()
):
    """Listar todo el inventario de la empresa"""
    return success_response(servicio.listar_por_empresa(usuario))


@router.get("/stock/{id}", response_model=RespuestaBase[InventarioLectura])
def obtener_inventario(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarioStock = Depends()
):
    """Obtener un registro de inventario específico"""
    return success_response(servicio.obtener_por_id(id, usuario))


@router.post("/stock/", response_model=RespuestaBase[InventarioLectura], status_code=status.HTTP_201_CREATED)
def crear_inventario(
    datos: InventarioCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_CREAR)),
    servicio: ServicioInventarioStock = Depends()
):
    """Crear un nuevo registro de inventario"""
    return success_response(servicio.crear(datos, usuario), "Inventario creado correctamente")


@router.put("/stock/{id}", response_model=RespuestaBase[InventarioLectura])
def actualizar_inventario(
    id: UUID,
    datos: InventarioActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_EDITAR)),
    servicio: ServicioInventarioStock = Depends()
):
    """Actualizar un registro de inventario"""
    return success_response(servicio.actualizar(id, datos, usuario), "Inventario actualizado correctamente")


@router.delete("/stock/{id}")
def eliminar_inventario(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_ELIMINAR)),
    servicio: ServicioInventarioStock = Depends()
):
    """Eliminar un registro de inventario"""
    servicio.eliminar(id, usuario)
    return success_response(None, "Inventario eliminado correctamente")


# --- Movimiento (Kardex) Routes ---
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
