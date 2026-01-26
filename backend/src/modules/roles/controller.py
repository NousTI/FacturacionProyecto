from fastapi import Depends, Request
from uuid import UUID
from .services import RolesServices
from .schemas import AsignacionRolRequest

class RolesController:
    def __init__(self, service: RolesServices = Depends()):
        self.service = service

    def listar_roles(self):
        roles = self.service.listar_roles()
        return {"data": roles}

    def obtener_roles_usuario(self, user_id: UUID):
        roles = self.service.obtener_roles_usuario(user_id)
        return {"data": roles}

    def asignar_rol(self, request: Request, body: AsignacionRolRequest):
        # Obtener quién realiza la acción desde el token (inyectado en request.state por Auth)
        autor_id = request.state.user_id if hasattr(request.state, 'user_id') else None
        
        self.service.asignar_rol_a_usuario(
            user_id=body.user_id,
            role_id=body.role_id,
            asignado_por=autor_id,
            motivo=body.motivo
        )
        return {"mensaje": "Rol asignado correctamente"}

    def remover_rol(self, request: Request, body: AsignacionRolRequest):
        autor_id = request.state.user_id if hasattr(request.state, 'user_id') else None
        
        self.service.remover_rol_de_usuario(
            user_id=body.user_id,
            role_id=body.role_id,
            removido_por=autor_id,
            motivo=body.motivo
        )
        return {"mensaje": "Rol removido correctamente"}
