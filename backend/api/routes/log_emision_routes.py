from fastapi import APIRouter, Depends, Query, status
from typing import List
from uuid import UUID

from models.LogEmision import LogEmisionCreate, LogEmisionRead
from services.log_emision_service import LogEmisionService
from dependencies.auth_dependencies import require_permission
from utils.enums import PermissionCodes

router = APIRouter()

@router.get("/", response_model=List[LogEmisionRead])
def list_logs(
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(require_permission(PermissionCodes.LOG_EMISION_VER)),
    service: LogEmisionService = Depends()
):
    return service.list(limit, offset)

@router.get("/factura/{factura_id}", response_model=List[LogEmisionRead])
def get_logs_by_factura(
    factura_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.LOG_EMISION_VER)),
    service: LogEmisionService = Depends()
):
    return service.get_by_factura(factura_id)

@router.post("/", response_model=LogEmisionRead, status_code=status.HTTP_201_CREATED)
def create_log(
    data: LogEmisionCreate,
    current_user: dict = Depends(require_permission(PermissionCodes.LOG_EMISION_VER)), # Permissive for now, or use specific CREATE perm if added
    service: LogEmisionService = Depends()
):
    return service.create(data)
