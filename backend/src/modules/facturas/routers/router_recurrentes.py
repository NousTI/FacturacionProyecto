from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from ..schemas_programacion import FacturacionProgramadaCreacion, FacturacionProgramadaLectura, FacturacionProgramadaActualizacion
from ..services.service_recurrentes import ServicioRecurrentes
from ...autenticacion.routes import requerir_permiso
from ....constants.permissions import PermissionCodes
from ....utils.response import success_response

router = APIRouter()

@router.post("/programacion", response_model=FacturacionProgramadaLectura, status_code=status.HTTP_201_CREATED)
def crear_programacion(
    datos: FacturacionProgramadaCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_CREAR)),
    servicio: ServicioRecurrentes = Depends()
):
    """Crea una nueva regla de facturación recurrente."""
    return servicio.crear_programacion(datos, usuario)

@router.get("/programacion", response_model=List[FacturacionProgramadaLectura])
def listar_programaciones(
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo/inactivo"),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioRecurrentes = Depends()
):
    """Lista las reglas de facturación recurrente de la empresa."""
    return servicio.listar_programaciones(usuario, activo)

@router.get("/programacion/{id}", response_model=FacturacionProgramadaLectura)
def obtener_programacion(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_VER_TODAS)),
    servicio: ServicioRecurrentes = Depends()
):
    """Obtiene el detalle de una programación específica."""
    return servicio.obtener_programacion(id, usuario)

@router.put("/programacion/{id}", response_model=FacturacionProgramadaLectura)
def actualizar_programacion(
    id: UUID,
    datos: FacturacionProgramadaActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioRecurrentes = Depends()
):
    """Actualiza una regla de facturación recurrente."""
    return servicio.actualizar_programacion(id, datos, usuario)

@router.delete("/programacion/{id}")
def eliminar_programacion(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.FACTURAS_EDITAR)),
    servicio: ServicioRecurrentes = Depends()
):
    """Elimina una regla de facturación recurrente."""
    servicio.eliminar_programacion(id, usuario)
    return success_response(None, "Programación eliminada correctamente")
