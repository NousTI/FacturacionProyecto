from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioReportes
from .schemas import ReporteLectura, ReporteCreacion
from ..autenticacion.dependencies import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes

router = APIRouter()

@router.get("/", response_model=List[ReporteLectura])
def listar_reportes(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioReportes = Depends()
):
    return servicio.listar_reportes(usuario)

@router.post("/", response_model=ReporteLectura, status_code=status.HTTP_201_CREATED)
def generar_reporte(
    datos: ReporteCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_EXPORTAR)),
    servicio: ServicioReportes = Depends()
):
    return servicio.crear_reporte(datos, usuario)

@router.delete("/{id}")
def eliminar_reporte(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioReportes = Depends()
):
    servicio.eliminar_reporte(id, usuario)
    return {"message": "Reporte eliminado correctamente"}
