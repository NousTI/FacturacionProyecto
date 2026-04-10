from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .schemas import ReporteGeneradoCreacion, ReporteGeneradoLectura, ReporteGeneradoActualizacion
from .service import ServicioReporteGenerado
from ..autenticacion.dependencies import get_current_user
from ...utils.response import success_response

router = APIRouter()


@router.get("/", response_model=List[ReporteGeneradoLectura])
def listar_reportes(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(get_current_user),
    servicio: ServicioReporteGenerado = Depends()
):
    return servicio.listar_reportes(usuario, empresa_id)


@router.post("/", response_model=ReporteGeneradoLectura, status_code=status.HTTP_201_CREATED)
def crear_reporte(
    datos: ReporteGeneradoCreacion,
    usuario: dict = Depends(get_current_user),
    servicio: ServicioReporteGenerado = Depends()
):
    return servicio.crear_reporte(datos, usuario)


@router.get("/{id}", response_model=ReporteGeneradoLectura)
def obtener_reporte(
    id: UUID,
    usuario: dict = Depends(get_current_user),
    servicio: ServicioReporteGenerado = Depends()
):
    return servicio.obtener_reporte(id, usuario)


@router.put("/{id}", response_model=ReporteGeneradoLectura)
def actualizar_reporte(
    id: UUID,
    datos: ReporteGeneradoActualizacion,
    usuario: dict = Depends(get_current_user),
    servicio: ServicioReporteGenerado = Depends()
):
    return servicio.actualizar_reporte(id, datos, usuario)


@router.delete("/{id}")
def eliminar_reporte(
    id: UUID,
    usuario: dict = Depends(get_current_user),
    servicio: ServicioReporteGenerado = Depends()
):
    servicio.eliminar_reporte(id, usuario)
    return success_response(None, "Reporte eliminado correctamente")


@router.post("/{id}/descargar")
def descargar_reporte(
    id: UUID,
    usuario: dict = Depends(get_current_user),
    servicio: ServicioReporteGenerado = Depends()
):
    return servicio.descargar_reporte(id, usuario)
