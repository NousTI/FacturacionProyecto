from fastapi import Depends, Request
from typing import List, Optional
from uuid import UUID
import logging

from .repositories import RepositorioUsuarios
from ..empresa_roles.repositories import RepositorioRoles
from .schemas import UsuarioCreacion, UsuarioActualizacion, CambioPassword
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ..logs.service import ServicioLogs
from ...utils.password import get_password_hash

logger = logging.getLogger("facturacion_api")

class ServicioUsuarios:
    def __init__(
        self, 
        repo: RepositorioUsuarios = Depends(),
        roles_repo: RepositorioRoles = Depends(),
        logs_service: ServicioLogs = Depends()
    ):
        self.repo = repo
        self.roles_repo = roles_repo
        self.logs_service = logs_service
    
    def listar_usuarios(self, usuario_actual: dict):
        """List users in current user's empresa"""
        empresa_id = usuario_actual.get('empresa_id')
        if not empresa_id:
            raise AppError("Usuario sin empresa asignada", 400)
        
        return self.repo.listar_usuarios(empresa_id)
    
    def obtener_usuario(self, id: UUID, usuario_actual: dict):
        """Get user (verify empresa ownership)"""
        # If Superadmin or Vendedor, return the augmented record with traceability
        if usuario_actual.get(AuthKeys.IS_SUPERADMIN) or usuario_actual.get(AuthKeys.IS_VENDEDOR):
            return self.obtener_usuario_admin(id)

        usuario = self.repo.obtener_usuario(id)
        if not usuario:
            raise AppError("Usuario no encontrado", 404)
        
        # Verify empresa ownership
        if str(usuario['empresa_id']) != str(usuario_actual.get('empresa_id')):
             raise AppError("No autorizado", 403)
        
        return usuario
    
    def crear_usuario(self, data: UsuarioCreacion, usuario_actual: dict, request: Request):
        """Create new user (admin only)"""
        import uuid
        import unicodedata
        import re
        from urllib.parse import urlparse

        # Get domain from request
        domain = request.headers.get("origin")
        if domain:
            domain_name = urlparse(domain).hostname
        else:
            domain_name = request.url.hostname
        if not domain_name:
            domain_name = "nousesaas.com"
            
        # Ensure it has an extension (e.g. localhost -> localhost.com)
        if "." not in domain_name:
            domain_name = f"{domain_name}.com"

        # clean name for email
        def _clean_str(s):
            if not s: return ""
            s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
            s = s.lower()
            return re.sub(r'[^a-z0-9]', '', s)
            
        # Dynamically generate email to not allow frontend email
        base_name = _clean_str(data.nombres.split()[0]) if data.nombres else "usuario"
        base_last = _clean_str(data.apellidos.split()[0]) if getattr(data, 'apellidos', None) else ""
        random_str = uuid.uuid4().hex[:4]
        
        prefix = f"{base_name}.{base_last}" if base_last else base_name
        data.email = f"{prefix}.{random_str}@{domain_name}"
        # Auto-inject empresa_id from the current user if not provided
        if not data.empresa_id:
            empresa_id_actual = usuario_actual.get('empresa_id')
            if not empresa_id_actual:
                raise AppError("No se pudo determinar la empresa del usuario", 400)
            data.empresa_id = empresa_id_actual

        # Force default password
        data.password = "password"

        # Verify user is creating in their empresa or is a vendor for that empresa
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            es_vendedor = usuario_actual.get(AuthKeys.IS_VENDEDOR, False)
            
            if es_vendedor:
                vendedor_id = usuario_actual.get('internal_vendedor_id')
                if not vendedor_id:
                     raise AppError("No autorizado", 403, description="Perfil de vendedor no encontrado")
                pass 
            else:
                # Regular company admins can only create users in their own company
                if str(data.empresa_id) != str(usuario_actual.get('empresa_id')):
                    raise AppError("No autorizado", 403)
        
        # Prepare user data (authentication)
        user_data = {
            'email': data.email,
            'password_hash': get_password_hash(data.password),
            'estado': 'ACTIVA',
            'requiere_cambio_password': True,
            'role': 'USUARIO'  # Generic role in users table
        }
        
        # ... (rest of the creation logic remains the same)
        
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
        elif usuario_actual.get(AuthKeys.IS_VENDEDOR):
            log_data['origen'] = 'vendedor'
        elif not usuario_actual.get('id'):
            log_data['origen'] = 'sistema'
            log_data['actor_rol_sistema'] = 'sistema'
        
        return self.repo.crear_usuario(user_data, usuario_data, log_data)
    
    def actualizar_usuario(self, id: UUID, data: UsuarioActualizacion, usuario_actual: dict):
        """Update user (verify empresa ownership)"""
        usuario = self.obtener_usuario(id, usuario_actual)
        
        update_data = data.model_dump(exclude_unset=True)
        
        # New Rule: Cannot change own role
        if str(id) == str(usuario_actual.get('usuario_id')) or str(id) == str(usuario_actual.get('id')):
            if 'empresa_rol_id' in update_data:
                # Permitiendo actualizar otros campos pero no el rol a sí mismo
                update_data.pop('empresa_rol_id')
                logger.warning(f"[SEGURIDAD] Usuario {usuario_actual.get('email')} intentó cambiar su propio rol. Acción bloqueada.")

        res = self.repo.actualizar_usuario(id, update_data)
        
        # Note: No registramos en users_logs porque esa tabla es solo para eventos de autenticación
        return res
    
    def eliminar_usuario(self, id: UUID, usuario_actual: dict):
        """Delete user (admin only)"""
        # New Rule: Cannot delete self
        if str(id) == str(usuario_actual.get('usuario_id')) or str(id) == str(usuario_actual.get('id')):
             raise AppError("No puedes eliminar tu propia cuenta de usuario.", 400)

        usuario = self.obtener_usuario(id, usuario_actual)
        
        if not self.repo.eliminar_usuario(id):
            raise AppError("Error al eliminar usuario", 500)
        
        return {"mensaje": "Usuario eliminado"}

    def obtener_perfil(self, usuario_actual: dict):
        """Get summarized profile of current logged in user"""
        user_id = usuario_actual.get('id')
        if not user_id:
            raise AppError("No se pudo identificar al usuario", 401)
        
        perfil = self.repo.obtener_perfil_completo(user_id)
        if not perfil:
            raise AppError("No se encontró el perfil del usuario", 404)
        
        return perfil

    def cambiar_password(self, data: CambioPassword, usuario_actual: dict):
        """Update current user's password"""
        user_id = usuario_actual.get('id')
        if not user_id:
             raise AppError("No se pudo identificar al usuario", 401)
        
        user = self.repo.obtener_por_id(user_id)
        if not user:
            raise AppError("Usuario no encontrado", 404)

        # Hashing and Updating
        hashed_password = get_password_hash(data.nueva_password)
        if not self.repo.actualizar_password(user_id, hashed_password):
            raise AppError("No se pudo actualizar la contraseña", 500)
        
        self.logs_service.registrar_evento(
            user_id=user_id,
            evento='PASSWORD_CAMBIADA',
            detail=f"Usuario {user.get('email')} cambió su contraseña",
            origen='USUARIO'
        )
        
        return {"mensaje": "Contraseña actualizada correctamente"}

    def listar_usuarios_admin(self, usuario_actual: dict, vendedor_id: Optional[UUID] = None):
        """List all users for Superadmin or filtered by Vendedor"""
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and usuario_actual.get(AuthKeys.ROLE) != 'VENDEDOR':
            raise AppError("No autorizado", 403)
        
        # If Vendedor, they can only see users of THEIR companies or users THEY created
        effective_vendedor_id = vendedor_id
        current_actor_user_id = None
        
        if usuario_actual.get(AuthKeys.ROLE) == 'VENDEDOR':
             effective_vendedor_id = usuario_actual.get('internal_vendedor_id')
             current_actor_user_id = usuario_actual.get('id')
        
        return self.repo.listar_todos_usuarios_admin(effective_vendedor_id, current_actor_user_id)

    def obtener_stats_admin(self, usuario_actual: dict, vendedor_id: Optional[UUID] = None):
        """Get stats for Superadmin or Vendedor"""
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and usuario_actual.get(AuthKeys.ROLE) != 'VENDEDOR':
            raise AppError("No autorizado", 403)
            
        effective_vendedor_id = vendedor_id
        current_actor_user_id = None
        
        if usuario_actual.get(AuthKeys.ROLE) == 'VENDEDOR':
             effective_vendedor_id = usuario_actual.get('internal_vendedor_id')
             current_actor_user_id = usuario_actual.get('id')
             
        return self.repo.obtener_stats_admin(effective_vendedor_id, current_actor_user_id)

    def toggle_status_admin(self, id: UUID, usuario_actual: dict):
        """Toggle user status and return full admin record"""
        usuario = self.obtener_usuario(id, usuario_actual)
        nuevo_estado = not usuario['activo']
        self.repo.actualizar_usuario(id, {'activo': nuevo_estado})
        
        evento_auth = 'CUENTA_DESBLOQUEADA' if nuevo_estado else 'CUENTA_DESHABILITADA'
        op_origen = 'SUPERADMIN' if usuario_actual.get(AuthKeys.IS_SUPERADMIN) else 'USUARIO'
        self.logs_service.registrar_evento(
            user_id=usuario_actual.get('id'),
            evento=evento_auth,
            detail=f"Usuario {usuario.get('email')} cambiado a {'ACTIVO' if nuevo_estado else 'INACTIVO'}",
            origen=op_origen
        )

        return self.obtener_usuario_admin(id)

    def reasignar_empresa_admin(self, id: UUID, nueva_empresa_id: UUID, usuario_actual: dict):
        """Reassign user to another empresa and return full admin record"""
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo el superadministrador puede reasignar empresas", 403)
        
        self.repo.actualizar_usuario(id, {'empresa_id': nueva_empresa_id})
        return self.obtener_usuario_admin(id)

    def obtener_usuario_admin(self, id: UUID):
        """Helper to get a single user with admin fields including traceability names"""
        query = """
            SELECT 
                u.id, u.user_id, u.nombres, u.apellidos, u.telefono, u.avatar_url, u.activo,
                us.email, us.ultimo_acceso, us.created_at, u.updated_at,
                er.nombre as rol_nombre, er.id as empresa_rol_id,
                e.id as empresa_id, e.razon_social as empresa_nombre, e.vendedor_id,
                l.origen as origen_creacion,
                actor.actor_nombre as creado_por_nombre,
                actor.actor_email as creado_por_email,
                l.created_at as fecha_creacion_log
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            LEFT JOIN sistema_facturacion.usuario_creacion_logs l ON u.id = l.usuario_id
            LEFT JOIN (
                SELECT us2.id, 
                    COALESCE(u2.nombres || ' ' || u2.apellidos, s2.nombres || ' ' || s2.apellidos, v2.nombres || ' ' || v2.apellidos) as actor_nombre,
                    us2.email as actor_email
                FROM sistema_facturacion.users us2
                LEFT JOIN sistema_facturacion.usuarios u2 ON us2.id = u2.user_id
                LEFT JOIN sistema_facturacion.superadmin s2 ON us2.id = s2.user_id
                LEFT JOIN sistema_facturacion.vendedores v2 ON us2.id = v2.user_id
            ) actor ON l.actor_user_id = actor.id
            WHERE u.id = %s
        """
        with self.repo.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            if not row:
                raise AppError("Usuario no encontrado", 404)
            return dict(row)
