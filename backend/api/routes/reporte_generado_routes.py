from fastapi import APIRouter, Depends, Query, status
from typing import List
from uuid import UUID

from models.ReporteGenerado import ReporteGeneradoCreate, ReporteGeneradoRead
from services.reporte_generado_service import ReporteGeneradoService
from dependencies.auth_dependencies import require_permission
from utils.enums import PermissionCodes

router = APIRouter()

@router.post("/", response_model=ReporteGeneradoRead, status_code=status.HTTP_201_CREATED)
def generate_report(
    data: ReporteGeneradoCreate,
    # Generating a report usually corresponds to 'EXPORTAR' or creating a new report record
    current_user: dict = Depends(require_permission(PermissionCodes.REPORTE_EXPORTAR)), 
    service: ReporteGeneradoService = Depends()
):
    return service.create(data, current_user)

@router.get("/", response_model=List[ReporteGeneradoRead])
def list_reports(
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(require_permission(PermissionCodes.REPORTE_VER)),
    service: ReporteGeneradoService = Depends()
):
    return service.list(current_user, limit, offset)

@router.get("/{id}", response_model=ReporteGeneradoRead)
def get_report(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.REPORTE_VER)),
    service: ReporteGeneradoService = Depends()
):
    return service.get_by_id(id, current_user)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_report(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.REPORTE_VER)),
    service: ReporteGeneradoService = Depends()
):
    service.delete(id, current_user)
    return {"message": "Reporte eliminado correctamente"}
