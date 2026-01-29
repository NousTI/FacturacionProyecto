from fastapi import APIRouter, Depends
from typing import List
from uuid import UUID
from .schemas import VendedorCreacion, VendedorActualizacion, VendedorLectura, VendedorStats, ReasignacionEmpresas
from .controller import VendedorController
from ..autenticacion.routes import obtener_usuario_actual
from ...utils.response_schemas import RespuestaBase

router = APIRouter(redirect_slashes=False)

@router.get("/stats", response_model=RespuestaBase[VendedorStats])
def obtener_stats(
    usuario: dict = Depends(obtener_usuario_actual),
    controller: VendedorController = Depends()
):
    return controller.obtener_stats(usuario)

@router.post("", response_model=RespuestaBase[VendedorLectura], status_code=201)
def crear_vendedor(
    datos: VendedorCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: VendedorController = Depends()
):
    return controller.crear_vendedor(datos, usuario)

@router.get("", response_model=RespuestaBase[List[VendedorLectura]])
def listar_vendedores(
    usuario: dict = Depends(obtener_usuario_actual),
    controller: VendedorController = Depends()
):
    return controller.listar_vendedores(usuario)

@router.get("/{id}", response_model=RespuestaBase[VendedorLectura])
def obtener_vendedor(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: VendedorController = Depends()
):
    return controller.obtener_vendedor(id, usuario)

@router.put("/{id}", response_model=RespuestaBase[VendedorLectura])
def actualizar_vendedor(
    id: UUID,
    datos: VendedorActualizacion,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: VendedorController = Depends()
):
    return controller.actualizar_vendedor(id, datos, usuario)

@router.patch("/{id}/toggle-status", response_model=RespuestaBase[VendedorLectura])
def toggle_status(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: VendedorController = Depends()
):
    return controller.toggle_status(id, usuario)

@router.post("/{id}/reasignar-empresas")
def reasignar_empresas(
    id: UUID,
    datos: ReasignacionEmpresas,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: VendedorController = Depends()
):
    return controller.reasignar_empresas(id, datos, usuario)

@router.get("/{id}/empresas")
def obtener_empresas(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: VendedorController = Depends()
):
    return controller.obtener_empresas(id, usuario)

@router.delete("/{id}")
def eliminar_vendedor(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: VendedorController = Depends()
):
    return controller.eliminar_vendedor(id, usuario)
