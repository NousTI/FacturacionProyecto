from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repositories import RolesRepository
from ...errors.app_error import AppError

class RolesServices:
    def __init__(self, repo: RolesRepository = Depends()):
        self.repo = repo

    def listar_roles(self):
        return self.repo.listar_roles()

    def obtener_roles_usuario(self, user_id: UUID):
        return self.repo.obtener_roles_usuario(user_id)

    def asignar_rol_a_usuario(self, user_id: UUID, role_id: UUID, asignado_por: UUID, motivo: str = None):
        # 1. Verificar que el rol existe
        rol = self.repo.obtener_rol_por_id(role_id)
        if not rol:
            raise AppError("El rol especificado no existe", 404, "ROLE_NOT_FOUND")

        # 2. Asignar
        self.repo.asignar_rol(user_id, role_id)

        # 3. Auditar
        self.repo.registrar_log_rol(
            user_id=user_id,
            role_id=role_id,
            accion='ROL_ASIGNADO',
            realizado_por=asignado_por,
            motivo=motivo
        )
        return True

    def remover_rol_de_usuario(self, user_id: UUID, role_id: UUID, removido_por: UUID, motivo: str = None):
        # 1. Remover
        self.repo.remover_rol(user_id, role_id)

        # 2. Auditar
        self.repo.registrar_log_rol(
            user_id=user_id,
            role_id=role_id,
            accion='ROL_REMOVIDO',
            realizado_por=removido_por,
            motivo=motivo
        )
        return True
