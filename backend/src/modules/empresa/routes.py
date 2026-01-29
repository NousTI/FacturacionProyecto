from fastapi import APIRouter, Depends
from typing import List, Optional
from uuid import UUID
from .schemas import EmpresaCreacion, EmpresaActualizacion, EmpresaLectura, EmpresaAsignarVendedor
from .controller import EmpresaController
from ..autenticacion.routes import obtener_usuario_actual
from ...utils.response_schemas import RespuestaBase

router = APIRouter(redirect_slashes=False)

@router.get("/stats")
def obtener_estadisticas(
    usuario: dict = Depends(obtener_usuario_actual),
    controller: EmpresaController = Depends()
):
    return controller.obtener_estadisticas(usuario)

@router.post("", response_model=RespuestaBase[EmpresaLectura], status_code=201)
def crear_empresa(
    datos: EmpresaCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: EmpresaController = Depends()
):
    return controller.crear_empresa(datos, usuario)

@router.get("", response_model=RespuestaBase[List[EmpresaLectura]])
def listar_empresas(
    vendedor_id: Optional[UUID] = None,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: EmpresaController = Depends()
):
    return controller.listar_empresas(usuario, vendedor_id)

@router.get("/{empresa_id}", response_model=RespuestaBase[EmpresaLectura])
def obtener_empresa(
    empresa_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: EmpresaController = Depends()
):
    return controller.obtener_empresa(empresa_id, usuario)

@router.put("/{empresa_id}", response_model=RespuestaBase[EmpresaLectura])
def actualizar_empresa(
    empresa_id: UUID,
    datos: EmpresaActualizacion,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: EmpresaController = Depends()
):
    return controller.actualizar_empresa(empresa_id, datos, usuario)

@router.delete("/{empresa_id}")
def eliminar_empresa(
    empresa_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: EmpresaController = Depends()
):
    return controller.eliminar_empresa(empresa_id, usuario)

@router.patch("/{empresa_id}/toggle-active", response_model=RespuestaBase[EmpresaLectura])
def toggle_active(
    empresa_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: EmpresaController = Depends()
):
    return controller.toggle_active(empresa_id, usuario)

@router.patch("/{empresa_id}/assign-vendor", response_model=RespuestaBase[EmpresaLectura])
def assign_vendor(
    empresa_id: UUID,
    datos: EmpresaAsignarVendedor,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: EmpresaController = Depends()
):
    return controller.asignar_vendedor(empresa_id, datos, usuario)
