from fastapi import Depends
from uuid import UUID
from .repositories import RepositorioUsuarios
from ..empresa_roles.repositories import RepositorioRoles
from .schemas import UsuarioCreacion, UsuarioActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ...utils.password import get_password_hash

class ServicioUsuarios:
    def __init__(
        self, 
        repo: RepositorioUsuarios = Depends(),
        roles_repo: RepositorioRoles = Depends()
    ):
        self.repo = repo
        self.roles_repo = roles_repo
    
    def listar_usuarios(self, usuario_actual: dict):
        """List users in current user's empresa"""
        empresa_id = usuario_actual.get('empresa_id')
        if not empresa_id:
            raise AppError("Usuario sin empresa asignada", 400)
        
        return self.repo.listar_usuarios(empresa_id)
    
    def obtener_usuario(self, id: UUID, usuario_actual: dict):
        """Get user (verify empresa ownership)"""
        usuario = self.repo.obtener_usuario(id)
        if not usuario:
            raise AppError("Usuario no encontrado", 404)
        
        # Verify empresa ownership
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(usuario['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403)
        
        return usuario
    
    def crear_usuario(self, data: UsuarioCreacion, usuario_actual: dict):
        """Create new user (admin only)"""
        # Verify user is creating in their empresa
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(data.empresa_id) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403)
        
        # Prepare user data (authentication)
        user_data = {
            'email': data.email,
            'password_hash': get_password_hash(data.password),
            'is_active': True,
            'role': 'USUARIO'  # Generic role in users table
        }
        
        # Prepare usuario data (profile)
        # Si no se provee un rol, asignar el rol de administrador de la empresa por defecto
        final_rol_id = data.empresa_rol_id
        if not final_rol_id:
            rol_admin = self.roles_repo.obtener_rol_admin_por_empresa(data.empresa_id)
            if rol_admin:
                final_rol_id = rol_admin['id']
            else:
                raise AppError(
                    "No se pudo encontrar un rol de administrador para esta empresa", 
                    400,
                    description="Debe existir al menos un rol de Administrador de Empresa para crear usuarios automáticamente."
                )

        usuario_data = {
            'empresa_id': data.empresa_id,
            'empresa_rol_id': final_rol_id,
            'nombres': data.nombres,
            'apellidos': data.apellidos,
            'telefono': data.telefono,
            'avatar_url': data.avatar_url,
            'activo': True
        }

        # Auditoría de creación
        log_data = {
            'actor_user_id': usuario_actual.get('id'),
            'actor_rol_sistema': usuario_actual.get(AuthKeys.ROLE),
            'actor_rol_empresa': usuario_actual.get('rol_nombre'),
            'empresa_id': usuario_actual.get('empresa_id'),
            'origen': 'sistema',
            'metadata': {'email_nuevo_usuario': data.email}
        }

        # Ajustar origen según reglas
        if usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            log_data['origen'] = 'superadmin'
            log_data['actor_rol_empresa'] = None
        elif usuario_actual.get('rol_nombre') == 'vendedor': # O lógica similar para vendedores
            log_data['origen'] = 'vendedor'
        elif not usuario_actual.get('id'):
            log_data['origen'] = 'sistema'
            log_data['actor_rol_sistema'] = 'sistema'
        
        return self.repo.crear_usuario(user_data, usuario_data, log_data)
    
    def actualizar_usuario(self, id: UUID, data: UsuarioActualizacion, usuario_actual: dict):
        """Update user (verify empresa ownership)"""
        usuario = self.obtener_usuario(id, usuario_actual)
        
        update_data = data.model_dump(exclude_unset=True)
        return self.repo.actualizar_usuario(id, update_data)
    
    def eliminar_usuario(self, id: UUID, usuario_actual: dict):
        """Delete user (admin only)"""
        usuario = self.obtener_usuario(id, usuario_actual)
        
        if not self.repo.eliminar_usuario(id):
            raise AppError("Error al eliminar usuario", 500)
        
        return {"mensaje": "Usuario eliminado"}
