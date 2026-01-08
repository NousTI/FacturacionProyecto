import uuid
from fastapi import APIRouter, Depends, status, Request

from services.superadmin_service import SuperadminService
from dependencies.superadmin_dependencies import get_current_superadmin
from models.Superadmin import SuperadminRead

router = APIRouter(prefix="/api/superadmin", tags=["Superadmin"])



@router.post("/maintenance/check-subscriptions")
def check_subscriptions(
    current_admin=Depends(get_current_superadmin),
    service: SuperadminService = Depends()
):
    """
    Ejecuta manualmente el proceso de revisión de suscripciones vencidas.
    """
    return service.check_subscriptions(current_admin)
