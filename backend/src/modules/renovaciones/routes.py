from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from .services import ServicioRenovaciones
from .schemas import (
    SolicitudRenovacionCreate, 
    SolicitudRenovacionProcess, 
    SolicitudRenovacionLectura
)
from ..autenticacion.dependencies import get_current_user, requerir_superadmin

router = APIRouter()

@router.post("/", response_model=SolicitudRenovacionLectura)
async def solicitar_renovacion(
    data: SolicitudRenovacionCreate,
    current_user: dict = Depends(get_current_user),
    service: ServicioRenovaciones = Depends()
):
    """Permite a un Vendedor solicitar la renovación de una de sus empresas."""
    role = str(current_user.get("role") or "").upper()
    if role != "VENDEDOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Solo los vendedores pueden solicitar renovaciones."
        )
    
    user_id = UUID(str(current_user["id"]))
    return service.solicitar_renovacion(user_id, data)

@router.get("/", response_model=List[SolicitudRenovacionLectura])
async def listar_solicitudes(
    historial: bool = False,
    current_user: dict = Depends(get_current_user),
    service: ServicioRenovaciones = Depends()
):
    """Lista las solicitudes (historial=True para ver todo, historial=False para ver solo pendientes)."""
    return service.listar_solicitudes(current_user, historial)

@router.patch("/{id}/procesar", response_model=SolicitudRenovacionLectura)
async def procesar_solicitud(
    id: UUID,
    data: SolicitudRenovacionProcess,
    current_user: dict = Depends(requerir_superadmin),
    service: ServicioRenovaciones = Depends()
):
    """Permite al Superadmin aprobar o rechazar una solicitud de renovación."""
    user_id = UUID(str(current_user["id"]))
    return service.procesar_solicitud(id, user_id, data)
