from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from models.FacturaDetalle import FacturaDetalleCreateInput, FacturaDetalleRead, FacturaDetalleUpdate
from services.factura_detalle_service import FacturaDetalleService
from dependencies.auth_dependencies import require_permission
from utils.enums import PermissionCodes
from utils.responses import success_response

router = APIRouter()

# Using FACTURA_EDITAR permission for adding details to a draft invoice logic.
# Or FACTURA_CREAR if building it. 
# Usually 'FACTURA_CREAR' is for the header, 'FACTURA_EDITAR' for modifying content.

@router.post("/", response_model=FacturaDetalleRead, status_code=status.HTTP_201_CREATED)
def create_factura_detalle(
    data: FacturaDetalleCreateInput,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_EDITAR)),
    service: FacturaDetalleService = Depends()
):
    return service.create(data, current_user)

@router.get("/factura/{factura_id}", response_model=List[FacturaDetalleRead])
def list_factura_detalles(
    factura_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_VER)),
    service: FacturaDetalleService = Depends()
):
    return service.list(factura_id, current_user)

@router.put("/{id}", response_model=FacturaDetalleRead)
def update_factura_detalle(
    id: UUID,
    data: FacturaDetalleUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_EDITAR)),
    service: FacturaDetalleService = Depends()
):
    return service.update(id, data, current_user)

@router.delete("/{id}")
def delete_factura_detalle(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_EDITAR)),
    service: FacturaDetalleService = Depends()
):
    service.delete(id, current_user)
    return success_response("Detalle eliminado correctamente")
