from fastapi import Depends
from uuid import UUID
from .services import ServicioUsuarios
from .schemas import UsuarioCreacion, UsuarioActualizacion
from ...utils.response import success_response

class UsuarioController:
    def __init__(self, service: ServicioUsuarios = Depends()):
        self.service = service
    
    def listar_usuarios(self, usuario_actual: dict):
        usuarios = self.service.listar_usuarios(usuario_actual)
        return success_response(usuarios)
    
    def obtener_usuario(self, id: UUID, usuario_actual: dict):
        usuario = self.service.obtener_usuario(id, usuario_actual)
        return success_response(usuario)
    
    def crear_usuario(self, body: UsuarioCreacion, usuario_actual: dict):
        usuario = self.service.crear_usuario(body, usuario_actual)
        return success_response(usuario, "Usuario creado")
    
    def actualizar_usuario(self, id: UUID, body: UsuarioActualizacion, usuario_actual: dict):
        usuario = self.service.actualizar_usuario(id, body, usuario_actual)
        return success_response(usuario, "Usuario actualizado")
    
    def eliminar_usuario(self, id: UUID, usuario_actual: dict):
        resultado = self.service.eliminar_usuario(id, usuario_actual)
        return success_response(None, "Usuario eliminado")

    def obtener_perfil(self, usuario_actual: dict):
        perfil = self.service.obtener_perfil(usuario_actual)
        return success_response(perfil)

    def listar_usuarios_admin(self, usuario_actual: dict, vendedor_id: UUID = None):
        usuarios = self.service.listar_usuarios_admin(usuario_actual, vendedor_id)
        return success_response(usuarios)

    def obtener_stats_admin(self, usuario_actual: dict, vendedor_id: UUID = None):
        stats = self.service.obtener_stats_admin(usuario_actual, vendedor_id)
        return success_response(stats)

    def toggle_status_admin(self, id: UUID, usuario_actual: dict):
        usuario = self.service.toggle_status_admin(id, usuario_actual)
        # We need to return it in the format expected by admin view
        # Instead of complicates joins here, we grab it from the special list or similar
        return success_response(usuario, "Estado actualizado")

    def reasignar_empresa_admin(self, id: UUID, nueva_empresa_id: UUID, usuario_actual: dict):
        usuario = self.service.reasignar_empresa_admin(id, nueva_empresa_id, usuario_actual)
        return success_response(usuario, "Empresa reasignada")
