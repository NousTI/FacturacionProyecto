from fastapi import Depends
from .services import ServicioRoles
from .schemas import PermisoCreacion, RolCreacion, RolActualizacion
from uuid import UUID
from ...utils.response import success_response

class RolController:
    def __init__(self, service: ServicioRoles = Depends()):
        self.service = service
    
    # Permisos
    def listar_permisos(self):
        permisos = self.service.listar_permisos()
        return success_response(permisos)
    
    def crear_permiso(self, body: PermisoCreacion, usuario_actual: dict):
        permiso = self.service.crear_permiso(body, usuario_actual)
        return success_response(permiso, "Permiso creado")
    
    # Roles
    def listar_roles(self, usuario_actual: dict):
        roles = self.service.listar_roles(usuario_actual)
        return success_response(roles)
    
    def obtener_rol(self, id: UUID, usuario_actual: dict):
        rol = self.service.obtener_rol(id, usuario_actual)
        return success_response(rol)
    
    def crear_rol(self, body: RolCreacion, usuario_actual: dict):
        rol = self.service.crear_rol(body, usuario_actual)
        return success_response(rol, "Rol creado")
    
    def actualizar_rol(self, id: UUID, body: RolActualizacion, usuario_actual: dict):
        rol = self.service.actualizar_rol(id, body, usuario_actual)
        return success_response(rol, "Rol actualizado")
    
    def eliminar_rol(self, id: UUID, usuario_actual: dict):
        resultado = self.service.eliminar_rol(id, usuario_actual)
        return success_response(None, "Rol eliminado")
    
    # Permisos individuales
    def asignar_permiso(self, rol_id: UUID, permiso_id: UUID, usuario_actual: dict):
        resultado = self.service.asignar_permiso(rol_id, permiso_id, usuario_actual)
        return success_response(resultado, "Permiso asignado")
    
    def remover_permiso(self, rol_id: UUID, permiso_id: UUID, usuario_actual: dict):
        resultado = self.service.remover_permiso(rol_id, permiso_id, usuario_actual)
        return success_response(resultado, "Permiso removido")

