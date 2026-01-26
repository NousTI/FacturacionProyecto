from fastapi import APIRouter, Depends, Body, Path
from typing import List
from uuid import UUID
from .schemas import EmpresaCreacion, EmpresaActualizacion, EmpresaLectura, EmpresaAsignarVendedor
from .service import ServicioEmpresa
from ..autenticacion.routes import obtener_usuario_actual
from ...utils.response import success_response

router = APIRouter()

@router.get("/stats")
def obtener_estadisticas(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    return servicio.obtener_estadisticas(usuario)

@router.post("/", response_model=EmpresaLectura, status_code=201)
def crear_empresa(
    datos: EmpresaCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    return servicio.crear_empresa(datos, usuario)

@router.get("/", response_model=List[EmpresaLectura])
def listar_empresas(
    vendedor_id: UUID = None,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    return servicio.listar_empresas(usuario, vendedor_id)

@router.get("/{empresa_id}", response_model=EmpresaLectura)
def obtener_empresa(
    empresa_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    return servicio.obtener_empresa(empresa_id, usuario)

@router.put("/{empresa_id}", response_model=EmpresaLectura)
def actualizar_empresa(
    empresa_id: UUID,
    datos: EmpresaActualizacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    return servicio.actualizar_empresa(empresa_id, datos, usuario)

@router.delete("/{empresa_id}")
def eliminar_empresa(
    empresa_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    servicio.eliminar_empresa(empresa_id, usuario)
    return success_response(None, "Empresa eliminada correctamente")

@router.patch("/{empresa_id}/toggle-active", response_model=EmpresaLectura)
def toggle_active(
    empresa_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    return servicio.toggle_active(empresa_id, usuario)

@router.patch("/{empresa_id}/assign-vendor", response_model=EmpresaLectura)
def assign_vendor(
    empresa_id: UUID,
    datos: EmpresaAsignarVendedor,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    return servicio.assign_vendor(empresa_id, datos.vendedor_id, usuario)

@router.post("/{empresa_id}/change-plan")
def change_plan(
    empresa_id: UUID,
    payload: dict = Body(...),
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    pid = payload.get("plan_id")
    monto = payload.get("monto")
    observaciones = payload.get("observaciones")
    servicio.change_plan(empresa_id, pid, usuario, monto, observaciones)
    return success_response(None, "Plan cambiado correctamente")
