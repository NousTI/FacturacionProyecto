from fastapi import APIRouter, Depends, status, UploadFile, File, Form
from uuid import UUID
from typing import List, Optional

from .service import ServicioSRI
from .schemas import ConfigSRILectura, ConfigSRIActualizacion, AutorizacionSRILectura
from ..autenticacion.dependencies import obtener_usuario_actual, requerir_permiso, requerir_superadmin
from ...constants.permissions import PermissionCodes

router = APIRouter()

@router.post("/certificado", status_code=status.HTTP_201_CREATED)
async def subir_certificado(
    file: UploadFile = File(...),
    password: str = Form(...),
    ambiente: str = Form("1"),
    tipo_emision: str = Form("1"),
    empresa_id: Optional[UUID] = Form(None),
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioSRI = Depends()
):
    target_id = empresa_id if usuario.get('is_superadmin') else usuario.get('empresa_id')
    if not target_id: return None
    
    content = await file.read()
    return servicio.guardar_certificado(target_id, content, password, ambiente, tipo_emision)

@router.post("/facturas/{id}/enviar")
def enviar_factura(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_ENVIAR_SRI)),
    servicio: ServicioSRI = Depends()
):
    return servicio.enviar_factura(id, usuario)

@router.get("/configuracion", response_model=List[ConfigSRILectura])
def listar_configs(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioSRI = Depends()
):
    return servicio.repo.listar_configs()

@router.get("/configuracion/{empresa_id}", response_model=Optional[ConfigSRILectura])
def obtener_config(
    empresa_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioSRI = Depends()
):
    if not usuario.get('is_superadmin') and str(usuario.get('empresa_id')) != str(empresa_id):
        return None
    return servicio.repo.obtener_config(empresa_id)
