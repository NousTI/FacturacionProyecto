from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .inventario_service import ServicioInventarioStock
from .schemas import InventarioLectura, InventarioCreacion, InventarioActualizacion, InventarioResumen
from ..autenticacion.routes import requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase

router = APIRouter()


@router.get("/", response_model=RespuestaBase[List[InventarioLectura]])
def listar_inventario(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarioStock = Depends()
):
    """Listar todo el inventario de la empresa"""
    return success_response(servicio.listar_por_empresa(usuario))


@router.get("/resumen", response_model=RespuestaBase[List[InventarioResumen]])
def obtener_resumen_stock(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarioStock = Depends()
):
    """Obtener resumen de stock por estado para todos los productos"""
    return success_response(servicio.obtener_stock_resumen(usuario))


@router.get("/{id}", response_model=RespuestaBase[InventarioLectura])
def obtener_inventario(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_VER)),
    servicio: ServicioInventarioStock = Depends()
):
    """Obtener un registro de inventario específico"""
    return success_response(servicio.obtener_por_id(id, usuario))


@router.post("/", response_model=RespuestaBase[InventarioLectura], status_code=status.HTTP_201_CREATED)
def crear_inventario(
    datos: InventarioCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_CREAR)),
    servicio: ServicioInventarioStock = Depends()
):
    """Crear un nuevo registro de inventario"""
    return success_response(servicio.crear(datos, usuario), "Inventario creado correctamente")


@router.put("/{id}", response_model=RespuestaBase[InventarioLectura])
def actualizar_inventario(
    id: UUID,
    datos: InventarioActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_EDITAR)),
    servicio: ServicioInventarioStock = Depends()
):
    """Actualizar un registro de inventario"""
    return success_response(servicio.actualizar(id, datos, usuario), "Inventario actualizado correctamente")


@router.delete("/{id}")
def eliminar_inventario(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.INVENTARIO_ELIMINAR)),
    servicio: ServicioInventarioStock = Depends()
):
    """Eliminar un registro de inventario"""
    servicio.eliminar(id, usuario)
    return success_response(None, "Inventario eliminado correctamente")
