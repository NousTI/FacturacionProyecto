from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from ..schemas_programacion import (
    FacturacionProgramadaCreacion, 
    FacturacionProgramadaLectura, 
    FacturacionProgramadaActualizacion,
    FacturacionProgramadaHistorial,
    FacturacionProgramadaUnificada
)
from ..services.service_recurrentes import ServicioRecurrentes
from ...autenticacion.routes import requerir_permiso
from ....constants.permissions import PermissionCodes
from ....utils.response import success_response

router = APIRouter()

@router.post("/", response_model=FacturacionProgramadaLectura, status_code=status.HTTP_201_CREATED)
def crear_programacion(
    datos: FacturacionProgramadaCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_CREAR)),
    servicio: ServicioRecurrentes = Depends()
):
    """Crea una nueva regla de facturación recurrente."""
    return servicio.crear_programacion(datos, usuario)

@router.post("/unificada", response_model=FacturacionProgramadaLectura)
def crear_programacion_unificada(
    datos: FacturacionProgramadaUnificada,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_CREAR)),
    servicio: ServicioRecurrentes = Depends()
):
    """Crea una nueva regla de facturación recurrente unificada."""
    return servicio.crear_programacion_unificada(datos, usuario)

@router.get("/", response_model=List[FacturacionProgramadaLectura])
def listar_programaciones(
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo/inactivo"),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioRecurrentes = Depends()
):
    """Lista las reglas de facturación recurrente de la empresa."""
    return servicio.listar_programaciones(usuario, activo)

@router.get("/{id}", response_model=FacturacionProgramadaLectura)
def obtener_programacion(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioRecurrentes = Depends()
):
    """Obtiene el detalle de una programación específica."""
    return servicio.obtener_programacion(id, usuario)

@router.put("/{id}", response_model=FacturacionProgramadaLectura)
def actualizar_programacion(
    id: UUID,
    datos: FacturacionProgramadaActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioRecurrentes = Depends()
):
    """Actualiza una regla de facturación recurrente."""
    return servicio.actualizar_programacion(id, datos, usuario)

@router.delete("/{id}")
def eliminar_programacion(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioRecurrentes = Depends()
):
    """Elimina una regla de facturación recurrente."""
    servicio.eliminar_programacion(id, usuario)
    return success_response(None, "Programación eliminada correctamente")

@router.post("/ejecutar-masivo")
def ejecutar_emisiones_masivas(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_CREAR)),
    servicio: ServicioRecurrentes = Depends()
):
    """
    Dispara el proceso de generación de facturas pendientes.
    Útil para ser llamado por un Cron Job o trigger externo.
    """
    resultado = servicio.recurrentes.procesar_emisiones_automaticas()
    return success_response(resultado, "Proceso de emisiones automáticas completado")

@router.get("/{id}/historial", response_model=List[FacturacionProgramadaHistorial])
def obtener_historial(
    id: UUID,
    limit: int = Query(50, ge=1, le=200, description="Registros por página"),
    offset: int = Query(0, ge=0, description="Desplazamiento"),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioRecurrentes = Depends()
):
    """R-007: Obtiene el historial técnico de ejecuciones (logs) de una programación."""
    return servicio.obtener_historial(id, usuario, limit=limit, offset=offset)

@router.get("/{id}/plantilla")
def obtener_id_plantilla(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioRecurrentes = Depends()
):
    """Obtiene el ID de la plantilla asociada a una programación."""
    from ....errors.app_error import AppError
    plantilla_id = servicio.obtener_id_plantilla(id, usuario)
    if not plantilla_id:
        raise AppError("No se encontró una factura plantilla para esta programación", 404, "PLANTILLA_NOT_FOUND")
    return plantilla_id
