from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Request
from uuid import UUID
from typing import List, Optional

from .service import ServicioSRI
from .schemas import ConfigSRILectura, ConfigSRIActualizacion, ConfigSRIActualizacionParametros, AutorizacionSRILectura
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso, requerir_superadmin
from ...constants.permissions import PermissionCodes
from ...utils.response_schemas import RespuestaBase
from ...utils.logger import get_logger

logger = get_logger("sri")

router = APIRouter()

@router.post("/configuracion", status_code=status.HTTP_201_CREATED, response_model=RespuestaBase[ConfigSRILectura])
async def configurar_sri(
    file: UploadFile = File(...),
    password: str = Form(...),
    ambiente: str = Form("PRUEBAS"),
    tipo_emision: str = Form("NORMAL"),
    empresa_id: Optional[UUID] = Form(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CONFIG_SRI)),
    servicio: ServicioSRI = Depends()
):
    target_id = empresa_id if usuario.get('is_superadmin') else usuario.get('empresa_id')
    logger.info(f"Configurando SRI para empresa: {target_id}")
    if not target_id:
         return RespuestaBase(ok=False, mensaje="No se pudo determinar la empresa", codigo="ID_MISSING", status_code=400)
    
    content = await file.read()
    res = servicio.guardar_certificado(target_id, content, password, ambiente, tipo_emision)
    return RespuestaBase(detalles=res)

@router.patch("/configuracion/parametros", response_model=RespuestaBase[ConfigSRILectura])
def actualizar_parametros(
    params: ConfigSRIActualizacionParametros,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CONFIG_SRI)),
    servicio: ServicioSRI = Depends()
):
    target_id = usuario.get('empresa_id')
    if not target_id:
         return RespuestaBase(ok=False, mensaje="No se pudo determinar la empresa", codigo="ID_MISSING")
    res = servicio.actualizar_parametros(target_id, params)
    return RespuestaBase(detalles=res)

@router.post("/facturas/{id}/enviar", response_model=RespuestaBase)
def enviar_factura(
    id: UUID,
    request: Request,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_ENVIAR_SRI)),
    servicio: ServicioSRI = Depends()
):
    # Enriquecer usuario con metadatos del request para auditoría técnica
    # Intentar obtener IP real tras un proxy (X-Forwarded-For)
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "desconocida"

    usuario['ip'] = ip
    usuario['user_agent'] = request.headers.get("user-agent", "desconocido")
    usuario['version_app'] = request.headers.get("x-app-version", "1.0.0")
    
    res = servicio.enviar_factura(id, usuario)
    return RespuestaBase(detalles=res)


@router.get("/facturas/{id}/consultar", response_model=RespuestaBase)
def consultar_factura(
    id: UUID,
    request: Request,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURA_ENVIAR_SRI)),
    servicio: ServicioSRI = Depends()
):
    """Consulta el estado de una factura ya enviada al SRI."""
    # Enriquecer usuario con metadatos del request para auditoría técnica
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "desconocida"

    usuario['ip'] = ip
    usuario['user_agent'] = request.headers.get("user-agent", "desconocido")
    usuario['version_app'] = request.headers.get("x-app-version", "1.0.0")

    res = servicio.consultar_estado_sri(id, usuario)
    return RespuestaBase(detalles=res)

@router.get("/configuracion", response_model=RespuestaBase[Optional[ConfigSRILectura]])
def obtener_config_actual(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CONFIG_SRI)),
    servicio: ServicioSRI = Depends()
):
    empresa_id = usuario.get('empresa_id')
    logger.info(f"Usuario {usuario.get('email')} con rol {usuario.get('rol')} solicitando config para empresa {empresa_id}")
    
    if not empresa_id:
        return RespuestaBase(ok=False, mensaje="No se encontró empresa vinculada", codigo="ID_MISSING")
    
    res = servicio.repo.obtener_config(empresa_id)
    return RespuestaBase(detalles=res)

@router.get("/configuracion/list", response_model=RespuestaBase[List[ConfigSRILectura]])
def listar_todas_las_configs(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioSRI = Depends()
):
    res = servicio.repo.listar_configs()
    return RespuestaBase(detalles=res)

@router.get("/configuracion/stats", response_model=RespuestaBase)
def obtener_stats_certificados(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioSRI = Depends()
):
    res = servicio.repo.obtener_stats_certificados()
    return RespuestaBase(detalles=res)

@router.get("/configuracion/{empresa_id}", response_model=RespuestaBase[Optional[ConfigSRILectura]])
def obtener_config_por_id(
    empresa_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CONFIG_SRI)),
    servicio: ServicioSRI = Depends()
):
    if not usuario.get('is_superadmin') and str(usuario.get('empresa_id')) != str(empresa_id):
        return RespuestaBase(ok=False, mensaje="No tiene permiso", codigo="FORBIDDEN")
    
    res = servicio.repo.obtener_config(empresa_id)
    return RespuestaBase(detalles=res)
