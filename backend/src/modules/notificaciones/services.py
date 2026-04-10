from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from .repository import RepositorioNotificaciones
from .schemas import NotificacionCreate, NotificacionLectura, NotificacionUpdate

class ServicioNotificaciones:
    def __init__(self, repo: RepositorioNotificaciones = Depends()):
        self.repo = repo

    def crear_notificacion(self, data: NotificacionCreate) -> Optional[dict]:
        return self.repo.crear(data.model_dump())

    def obtener_notificaciones(self, user_id: UUID, solo_no_leidas: bool = False) -> List[dict]:
        return self.repo.listar_por_usuario(user_id, solo_no_leidas)

    def marcar_como_leida(self, id: UUID, user_id: UUID) -> Optional[dict]:
        return self.repo.marcar_como_leida(id, user_id)

    def marcar_todas_como_leidas(self, user_id: UUID) -> bool:
        return self.repo.marcar_todas_leidas(user_id)

    def obtener_conteo_no_leidas(self, user_id: UUID) -> int:
        return self.repo.contar_no_leidas(user_id)
