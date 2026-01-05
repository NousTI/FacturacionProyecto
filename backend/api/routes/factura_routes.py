from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from models.Factura import FacturaCreateInput, FacturaRead, FacturaUpdate
from models.Factura import FacturaCreateInput, FacturaRead, FacturaUpdate
from services.factura_service import FacturaService
from services.sri_service import SRIService
from dependencies.auth_dependencies import require_permission
from utils.enums import PermissionCodes
from utils.responses import success_response

router = APIRouter()

@router.post("/", response_model=FacturaRead, status_code=status.HTTP_201_CREATED)
def create_factura(
    data: FacturaCreateInput,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_CREAR)),
    service: FacturaService = Depends()
):
    return service.create(data, current_user)

@router.get("/", response_model=List[FacturaRead])
def list_facturas(
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    empresa_id: Optional[UUID] = Query(None),
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_VER)),
    service: FacturaService = Depends()
):
    return service.list(current_user, empresa_id, limit, offset)

@router.get("/{id}", response_model=FacturaRead)
def get_factura(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_VER)),
    service: FacturaService = Depends()
):
    return service.get_by_id(id, current_user)

# Using FACTURA_EDITAR, but typically Invoices shouldn't be fully editable
@router.put("/{id}", response_model=FacturaRead)
def update_factura(
    id: UUID,
    data: FacturaUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_EDITAR)),
    service: FacturaService = Depends()
):
    return service.update(id, data, current_user)

@router.delete("/{id}")
def delete_factura(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_ELIMINAR)),
    service: FacturaService = Depends()
):
    service.delete(id, current_user)
    return success_response("Factura eliminada correctamente")

@router.post("/{id}/enviar-sri")
def send_to_sri(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_CREAR)), # Or custom strict permission
    sri_service: SRIService = Depends()
):
    """
    Intenta enviar la factura al SRI (Ambiente Pruebas).
    Firma -> Valida -> Autoriza.
    """
    return sri_service.enviar_factura(id, current_user)
