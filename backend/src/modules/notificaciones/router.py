from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from uuid import UUID

from .services import ServicioNotificaciones
from .schemas import NotificacionLectura
from ..autenticacion.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[NotificacionLectura])
def listar_notificaciones(
    solo_no_leidas: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    service: ServicioNotificaciones = Depends()
):
    """Obtener historial de notificaciones del usuario actual"""
    return service.obtener_notificaciones(current_user['id'], solo_no_leidas)

@router.get("/conteo-no-leidas")
def obtener_conteo(
    current_user: dict = Depends(get_current_user),
    service: ServicioNotificaciones = Depends()
):
    """Obtener el número de notificaciones sin leer"""
    return {"count": service.obtener_conteo_no_leidas(current_user['id'])}

@router.patch("/{notificacion_id}/marcar-leida", response_model=Optional[NotificacionLectura])
def marcar_como_leida(
    notificacion_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: ServicioNotificaciones = Depends()
):
    """Marcar una notificación específica como leída"""
    return service.marcar_como_leida(notificacion_id, current_user['id'])

@router.patch("/marcar-todas-leidas")
def marcar_todas_como_leidas(
    current_user: dict = Depends(get_current_user),
    service: ServicioNotificaciones = Depends()
):
    """Marcar todas las notificaciones del usuario como leídas"""
    return {"success": service.marcar_todas_como_leidas(current_user['id'])}
