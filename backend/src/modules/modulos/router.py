from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioModulos
from .schemas import ModuloLectura, ModuloCreacion, ModuloEmpresaLectura
from ..autenticacion.routes import obtener_usuario_actual, requerir_superadmin

router = APIRouter()

@router.get("/", response_model=List[ModuloLectura])
def listar_modulos(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioModulos = Depends()
):
    return servicio.listar_todos()

@router.get("/me", response_model=List[ModuloEmpresaLectura])
def listar_mis_modulos(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioModulos = Depends()
):
    empresa_id = usuario.get('empresa_id')
    if not empresa_id: return []
    return servicio.listar_por_empresa(empresa_id)

@router.post("/", response_model=ModuloLectura)
def crear_modulo(
    datos: ModuloCreacion,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioModulos = Depends()
):
    return servicio.crear_modulo(datos)
