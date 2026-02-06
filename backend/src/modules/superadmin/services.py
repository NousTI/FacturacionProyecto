from fastapi import Depends
from uuid import UUID
from typing import Optional
import logging

from .repositories import SuperadminRepository
from ...errors.app_error import AppError

logger = logging.getLogger("facturacion_api")

class SuperadminServices:
    def __init__(self, repo: SuperadminRepository = Depends()):
        self.repo = repo

    def obtener_perfil(self, user_id: UUID):
        perfil = self.repo.obtener_perfil_por_user_id(user_id)
        if not perfil:
            raise AppError("Perfil de superadministrador no encontrado", 404, "SUPERADMIN_PROFILE_NOT_FOUND")
        return perfil

    def actualizar_perfil(self, user_id: UUID, datos: dict):
        # Filtrar solo campos permitidos para la tabla superadmin
        campos_permitidos = {'nombres', 'apellidos', 'activo'}
        data_update = {k: v for k, v in datos.items() if k in campos_permitidos}
        
        if not data_update:
            return False
            
        success = self.repo.actualizar_perfil(user_id, data_update)
        if not success:
            raise AppError("No se pudo actualizar el perfil", 400, "SUPERADMIN_UPDATE_ERROR")
        return True

    def asegurar_perfil_existe(self, user_id: UUID, nombres: str = "Admin", apellidos: str = "System"):
        """Garantiza que un usuario tenga su perfil de superadmin creado."""
        perfil = self.repo.obtener_perfil_por_user_id(user_id)
        if not perfil or not perfil.get('profile_id'):
            return self.repo.crear_perfil(user_id, nombres, apellidos)
        return perfil
