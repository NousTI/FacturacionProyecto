from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioLogs
from .schemas import LogEmisionLectura, LogEmisionCreacion
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes

router = APIRouter()

@router.get("/", response_model=List[LogEmisionLectura])
def listar_logs(
    limite: int = 100,
    desplazar: int = 0,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.LOG_EMISION_VER)),
    servicio: ServicioLogs = Depends()
):
    return servicio.listar_logs(limite, desplazar)

@router.get("/factura/{factura_id}", response_model=List[LogEmisionLectura])
def obtener_logs_factura(
    factura_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.LOG_EMISION_VER)),
    servicio: ServicioLogs = Depends()
):
    return servicio.obtener_por_factura(factura_id)

@router.post("/", response_model=LogEmisionLectura, status_code=status.HTTP_201_CREATED)
def crear_log(
    datos: LogEmisionCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.LOG_EMISION_VER)),
    servicio: ServicioLogs = Depends()
):
    return servicio.crear_log(datos)
