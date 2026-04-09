from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from .services import ServicioNotificaciones
from .schemas import NotificacionCreate, NotificacionLectura, NotificacionUpdate
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes

router = APIRouter()

@router.get("/", response_model=List[NotificacionLectura])
async def obtener_notificaciones(
    solo_no_leidas: bool = False,
    current_user: dict = Depends(requerir_permiso(PermissionCodes.NOTIFICACION_LISTAR)),
    service: ServicioNotificaciones = Depends()
):
    """Obtiene las notificaciones del usuario actual."""
    user_id = UUID(str(current_user["id"]))
    return service.obtener_notificaciones(user_id, solo_no_leidas)

@router.get("/conteo-no-leidas")
async def obtener_conteo_no_leidas(
    current_user: dict = Depends(requerir_permiso(PermissionCodes.NOTIFICACION_LEER)),
    service: ServicioNotificaciones = Depends()
):
    """Devuelve el número de notificaciones no leídas."""
    user_id = UUID(str(current_user["id"]))
    return {"conteo": service.obtener_conteo_no_leidas(user_id)}

@router.patch("/{id}/leer", response_model=NotificacionLectura)
async def marcar_como_leida(
    id: UUID,
    current_user: dict = Depends(requerir_permiso(PermissionCodes.NOTIFICACION_LEER)),
    service: ServicioNotificaciones = Depends()
):
    """Marca una notificación específica como leída."""
    user_id = UUID(str(current_user["id"]))
    notificacion = service.marcar_como_leida(id, user_id)
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada o no pertenece al usuario")
    return notificacion

@router.post("/leer-todas")
async def marcar_todas_como_leidas(
    current_user: dict = Depends(requerir_permiso(PermissionCodes.NOTIFICACION_LEER)),
    service: ServicioNotificaciones = Depends()
):
    """Marca todas las notificaciones del usuario como leídas."""
    user_id = UUID(str(current_user["id"]))
    service.marcar_todas_como_leidas(user_id)
    return {"success": True}
