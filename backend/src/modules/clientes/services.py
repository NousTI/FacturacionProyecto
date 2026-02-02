from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioClientes
from .schemas import ClienteCreacion, ClienteActualizacion
from ..vendedores.repositories import RepositorioVendedores
from ..empresas.repositories import RepositorioEmpresas
from ..empresa_roles.repositories import RepositorioRoles
from...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ...utils.password import get_password_hash

class ServicioClientes:
    def __init__(
        self, 
        repo: RepositorioClientes = Depends(),
        vendedor_repo: RepositorioVendedores = Depends(),
        empresa_repo: RepositorioEmpresas = Depends(),
        roles_repo: RepositorioRoles = Depends()
    ):
        self.repo = repo
        self.vendedor_repo = vendedor_repo
        self.empresa_repo = empresa_repo
        self.roles_repo = roles_repo

    def _get_context(self, current_user: dict):
        ctx = {
            "is_superadmin": current_user.get(AuthKeys.IS_SUPERADMIN, False),
            "is_vendedor": current_user.get(AuthKeys.IS_VENDEDOR, False),
            "user_id": current_user.get("id"),
            "vendedor_id": None,
            "puede_crear_permiso": False
        }
        
        if ctx["is_vendedor"]:
             vendedor_profile = self.vendedor_repo.obtener_por_user_id(ctx["user_id"])
             if vendedor_profile:
                 ctx["vendedor_id"] = vendedor_profile["id"]
                 ctx["puede_crear_permiso"] = vendedor_profile.get("puede_crear_empresas", False)
                 
        return ctx

    def listar_clientes(self, usuario_actual: dict, vendedor_id_filtro: Optional[UUID] = None):
        ctx = self._get_context(usuario_actual)
        
        if ctx["is_superadmin"]:
            return self.repo.listar_clientes(vendedor_id=vendedor_id_filtro)
        
        if ctx["is_vendedor"]:
            return self.repo.listar_clientes(vendedor_id=ctx["vendedor_id"])
            
        raise AppError("No autorizado", 403)

    def obtener_stats(self, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        
        if ctx["is_superadmin"]:
            return self.repo.obtener_stats()
            
        if ctx["is_vendedor"]:
            return self.repo.obtener_stats(vendedor_id=ctx["vendedor_id"])
            
        raise AppError("No autorizado", 403)

    def crear_cliente(self, datos: ClienteCreacion, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        
        # Permission check
        if not ctx["is_superadmin"]:
            if not ctx["is_vendedor"] or not ctx["puede_crear_permiso"]:
                raise AppError("No tienes permisos para crear clientes", 403)
            
            # Check if company belongs to vendor
            empresa = self.empresa_repo.obtener_por_id(datos.empresa_id)
            if not empresa or str(empresa.get('vendedor_id')) != str(ctx["vendedor_id"]):
                raise AppError("No autorizado: La empresa no está bajo tu gestión", 403)

        # Role automation: assign admin role if not provided
        final_rol_id = datos.empresa_rol_id
        if not final_rol_id:
            rol_admin = self.roles_repo.obtener_rol_admin_por_empresa(datos.empresa_id)
            if rol_admin:
                final_rol_id = rol_admin['id']
            else:
                raise AppError(
                    "No se pudo encontrar un rol de administrador para esta empresa",
                    400,
                    description="Debe existir al menos un rol de Administrador de Empresa."
                )

        # Prepare user data (Auth)
        user_data = {
            "email": datos.email,
            "password_hash": get_password_hash("password"), # Constant as requested
            "role": "USUARIO",
            "estado": "ACTIVA"
        }
        
        # Prepare usuario data (Profile)
        usuario_data = {
            "empresa_id": datos.empresa_id,
            "empresa_rol_id": final_rol_id,
            "nombres": datos.nombres,
            "apellidos": datos.apellidos,
            "telefono": datos.telefono,
            "avatar_url": datos.avatar_url,
            "activo": True
        }

        # Audit logging
        log_data = {
            'actor_user_id': usuario_actual.get('id'),
            'actor_rol_sistema': usuario_actual.get(AuthKeys.ROLE),
            'actor_rol_empresa': usuario_actual.get('rol_nombre'),
            'empresa_id': usuario_actual.get('empresa_id'),
            'origen': 'sistema',
            'metadata': {'email_nuevo_usuario': datos.email}
        }

        # Determine origen based on actor type
        if ctx["is_superadmin"]:
            log_data['origen'] = 'superadmin'
            log_data['actor_rol_empresa'] = None
        elif ctx["is_vendedor"]:
            log_data['origen'] = 'vendedor'
        elif not usuario_actual.get('id'):
            log_data['origen'] = 'sistema'
            log_data['actor_rol_sistema'] = 'sistema'
        
        return self.repo.crear_cliente_atomico(user_data, usuario_data, log_data)

    def eliminar_cliente(self, id: UUID, usuario_actual: dict):
        # Only superadmin or vendor managing the company can delete
        cliente = self.repo.obtener_por_id(id)
        if not cliente:
            raise AppError("Cliente no encontrado", 404)
            
        ctx = self._get_context(usuario_actual)
        
        if not ctx["is_superadmin"]:
            if not ctx["is_vendedor"]:
                raise AppError("No autorizado", 403)
            
            # Re-fetch company to check vendor_id
            empresa = self.empresa_repo.obtener_por_id(cliente['empresa_id'])
            if not empresa or str(empresa.get('vendedor_id')) != str(ctx["vendedor_id"]):
                raise AppError("No autorizado", 403)
                
        return self.repo.eliminar_cliente(id)

    def obtener_cliente_detalle(self, id: UUID, usuario_actual: dict):
        """Obtiene cliente con trazabilidad de creación"""
        ctx = self._get_context(usuario_actual)
        
        cliente = self.repo.obtener_cliente_con_trazabilidad(id)
        if not cliente:
            raise AppError("Cliente no encontrado", 404)
        
        # Verificar permisos
        if not ctx["is_superadmin"]:
            if ctx["is_vendedor"]:
                empresa = self.empresa_repo.obtener_por_id(cliente['empresa_id'])
                if not empresa or str(empresa.get('vendedor_id')) != str(ctx["vendedor_id"]):
                    raise AppError("No autorizado", 403)
            else:
                raise AppError("No autorizado", 403)
        
        return cliente

    def actualizar_cliente(self, id: UUID, datos: ClienteActualizacion, usuario_actual: dict):
        """Actualiza un cliente (solo superadmin)"""
        ctx = self._get_context(usuario_actual)
        
        # Solo superadmin puede editar
        if not ctx["is_superadmin"]:
            raise AppError("Solo el superadmin puede editar clientes", 403)
        
        # Verificar que existe
        cliente = self.repo.obtener_por_id(id)
        if not cliente:
            raise AppError("Cliente no encontrado", 404)
        
        # Preparar datos para actualizar
        update_data = datos.model_dump(exclude_unset=True)
        
        if not update_data:
            return cliente
        
        # Actualizar
        return self.repo.actualizar_cliente(id, update_data)

    def toggle_status_cliente(self, id: UUID, usuario_actual: dict):
        """Activa/desactiva un cliente (solo superadmin)"""
        ctx = self._get_context(usuario_actual)
        
        # Solo superadmin puede cambiar estado
        if not ctx["is_superadmin"]:
            raise AppError("Solo el superadmin puede cambiar el estado", 403)
        
        # Verificar que existe
        cliente = self.repo.obtener_por_id(id)
        if not cliente:
            raise AppError("Cliente no encontrado", 404)
        
        return self.repo.toggle_status(id)

    def reasignar_empresa_cliente(self, id: UUID, nueva_empresa_id: UUID, usuario_actual: dict):
        """Reasigna un cliente a una nueva empresa (solo superadmin)"""
        ctx = self._get_context(usuario_actual)
        
        # Solo superadmin puede reasignar
        if not ctx["is_superadmin"]:
            raise AppError("Solo el superadmin puede reasignar empresas", 403)
        
        # Verificar que el cliente existe
        cliente = self.repo.obtener_por_id(id)
        if not cliente:
            raise AppError("Cliente no encontrado", 404)
        
        # Verificar que la nueva empresa existe
        empresa = self.empresa_repo.obtener_por_id(nueva_empresa_id)
        if not empresa:
            raise AppError("Empresa no encontrada", 404)
        
        try:
            return self.repo.reasignar_empresa(id, nueva_empresa_id)
        except ValueError as e:
            raise AppError(str(e), 400)

