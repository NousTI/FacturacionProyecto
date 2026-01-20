from fastapi import APIRouter, Depends, Body, Path
from typing import List
from uuid import UUID
from .schemas import EmpresaCreacion, EmpresaActualizacion, EmpresaLectura
from .service import ServicioEmpresa
from ..autenticacion.dependencies import obtener_usuario_actual
from ...utils.response import success_response

router = APIRouter()

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
    payload: dict = Body(..., embed=True), # expects {"vendedor_id": "uuid"} wrapped or plain? 
    # Legacy used embed=False but body example showed dict.
    # Body(..., example={"vendedor_id": "..."}) -> Payload is the dict.
    # Let's extract straightforwardly.
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    # If payload comes as {"vendedor_id": "..."}
    vid = payload.get("vendedor_id")
    return servicio.assign_vendor(empresa_id, vid, usuario)

@router.post("/{empresa_id}/change-plan")
def change_plan(
    empresa_id: UUID,
    payload: dict = Body(...),
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioEmpresa = Depends()
):
    pid = payload.get("plan_id")
    servicio.change_plan(empresa_id, pid, usuario)
    return success_response(None, "Plan cambiado correctamente")
