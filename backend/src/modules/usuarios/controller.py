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
