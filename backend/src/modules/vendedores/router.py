from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioVendedores
from .schemas import VendedorLectura, VendedorCreacion, VendedorActualizacion, VendedorStats, ReasignacionEmpresas
from ..autenticacion.routes import obtener_usuario_actual

router = APIRouter()

@router.get("/stats", response_model=VendedorStats)
def obtener_stats_vendedores(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioVendedores = Depends()
):
    return servicio.obtener_stats_vendedores(usuario)

@router.get("/", response_model=List[VendedorLectura])
def listar_vendedores(
    usuario: dict = Depends(obtener_usuario_actual) ,
    servicio: ServicioVendedores = Depends()
):
    return servicio.listar_vendedores(usuario)

@router.get("/{id}", response_model=VendedorLectura)
def obtener_vendedor(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioVendedores = Depends()
):
    return servicio.obtener_vendedor(id, usuario)

@router.post("/", response_model=VendedorLectura, status_code=status.HTTP_201_CREATED)
def crear_vendedor(
    datos: VendedorCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioVendedores = Depends()
):
    return servicio.crear_vendedor(datos, usuario)

@router.patch("/{id}/toggle-status", response_model=VendedorLectura)
def toggle_status_vendedor(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioVendedores = Depends()
):
    return servicio.toggle_status_vendedor(id, usuario)

@router.post("/{id}/reasignar")
def reasignar_empresas_vendedor(
    id: UUID,
    datos: ReasignacionEmpresas,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioVendedores = Depends()
):
    return servicio.reasignar_empresas_vendedor(id, datos, usuario)

@router.get("/{id}/empresas")
def obtener_empresas_vendedor(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioVendedores = Depends()
):
    return servicio.obtener_empresas_vendedor(id, usuario)

@router.put("/{id}", response_model=VendedorLectura)
def actualizar_vendedor(
    id: UUID,
    datos: VendedorActualizacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioVendedores = Depends()
):
    return servicio.actualizar_vendedor(id, datos, usuario)

@router.delete("/{id}")
def eliminar_vendedor(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioVendedores = Depends()
):
    servicio.eliminar_vendedor(id, usuario)
    return {"message": "Vendedor eliminado exitosamente"}
