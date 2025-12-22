from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID

from models.FacturaProgramada import FacturaProgramadaCreateInput, FacturaProgramadaRead, FacturaProgramadaUpdate
from services.facturacion_programada_service import FacturacionProgramadaService
from dependencies.auth_dependencies import get_current_user, require_permission
from utils.enums import PermissionCodes
from utils.responses import success_response

router = APIRouter()

@router.post("/", response_model=FacturaProgramadaRead, status_code=status.HTTP_201_CREATED)
def create_facturacion_programada(
    data: FacturaProgramadaCreateInput,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_PROGRAMADA_CREAR)),
    service: FacturacionProgramadaService = Depends()
):
    # Pass current_user directly to service to handle logic for superadmin vs users
    return service.create(data, current_user)

@router.get("/", response_model=List[FacturaProgramadaRead])
def list_facturacion_programada(
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    empresa_id: Optional[UUID] = Query(None),
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_PROGRAMADA_VER)),
    service: FacturacionProgramadaService = Depends()
):
    return service.list(current_user, empresa_id, limit, offset)

@router.get("/{id}", response_model=FacturaProgramadaRead)
def get_facturacion_programada(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_PROGRAMADA_VER)),
    service: FacturacionProgramadaService = Depends()
):
    return service.get_by_id(id, current_user)

@router.put("/{id}", response_model=FacturaProgramadaRead)
def update_facturacion_programada(
    id: UUID,
    data: FacturaProgramadaUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_PROGRAMADA_EDITAR)),
    service: FacturacionProgramadaService = Depends()
):
    return service.update(id, data, current_user)

@router.delete("/{id}")
def delete_facturacion_programada(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_PROGRAMADA_ELIMINAR)),
    service: FacturacionProgramadaService = Depends()
):
    service.delete(id, current_user)
    return success_response("Facturación programada eliminada correctamente")
