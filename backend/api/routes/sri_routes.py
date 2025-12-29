from fastapi import APIRouter, Depends, status
from uuid import UUID
from services.sri_service import SRIService
from dependencies.auth_dependencies import require_permission
from utils.enums import PermissionCodes

router = APIRouter()

@router.post("/facturas/{id}/enviar", status_code=status.HTTP_200_OK)
def enviar_factura_sri(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.FACTURA_ENVIAR_SRI)),
    service: SRIService = Depends()
):
    """
    Endpoint protegedio por FACTURA_ENVIAR_SRI.
    Genera el XML (Phase 1) y simula el envío.
    """
    return service.enviar_factura_sri(id, current_user)
