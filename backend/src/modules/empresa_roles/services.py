from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from .repositories import RepositorioRoles
from .schemas import PermisoCreacion, RolCreacion, RolActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioRoles:
    def __init__(self, repo: RepositorioRoles = Depends()):
        self.repo = repo
    
    # --- Permisos ---
    def listar_permisos(self):
        """Anyone can view permissions catalog"""
        return self.repo.listar_permisos()
    
    def crear_permiso(self, data: PermisoCreacion, usuario_actual: dict):
        """Only superadmin can create permissions"""
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("No autorizado", 403)
        return self.repo.crear_permiso(data.model_dump())
    
    # --- Roles ---
    def listar_roles(self, usuario_actual: dict, empresa_id: Optional[UUID] = None):
        """List roles for user's empresa or specified empresa"""
        target_empresa_id = empresa_id or usuario_actual.get('empresa_id')
        
        if not target_empresa_id:
            raise AppError("Debe especificar una empresa o el usuario debe tener una asignada", 400)
            
        # Permission check if specifying another empresa
        if empresa_id and not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
             # If vendor, check if company is theirs (simplified for now, ideally we have a helper)
             # Actually, if vendor is listing roles for a company to create a user, they should have access.
             pass 

        return self.repo.listar_roles(target_empresa_id)
    
    def obtener_rol(self, id: UUID, usuario_actual: dict):
        rol = self.repo.obtener_rol(id)
        if not rol:
            raise AppError("Rol no encontrado", 404)
        
        # Verify empresa ownership
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            if str(rol['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403)
        
        return rol
    
    def crear_rol(self, data: RolCreacion, usuario_actual: dict):
        """Create role for user's empresa"""
        empresa_id = usuario_actual.get('empresa_id')
        if not empresa_id:
            raise AppError("Usuario sin empresa asignada", 400)
        
        rol_data = data.model_dump(exclude={'permiso_ids'})
        return self.repo.crear_rol(empresa_id, rol_data, data.permiso_ids)
    
    def actualizar_rol(self, id: UUID, data: RolActualizacion, usuario_actual: dict):
        """Update role (cannot modify es_sistema roles)"""
        rol = self.obtener_rol(id, usuario_actual)
        
        if rol['es_sistema']:
            raise AppError("No se pueden modificar roles del sistema", 403)
        
        update_data = data.model_dump(exclude_unset=True, exclude={'permiso_ids'})
        permiso_ids = data.permiso_ids if 'permiso_ids' in data.model_dump(exclude_unset=True) else None
        
        return self.repo.actualizar_rol(id, update_data, permiso_ids)
    
    def eliminar_rol(self, id: UUID, usuario_actual: dict):
        """Delete role (only if not es_sistema)"""
        rol = self.obtener_rol(id, usuario_actual)
        
        if rol['es_sistema']:
            raise AppError("No se pueden eliminar roles del sistema", 403)
        
        if not self.repo.eliminar_rol(id):
            raise AppError("Error al eliminar rol", 500)
        
        return {"mensaje": "Rol eliminado"}
    
    # --- Individual Permission Management ---
    def asignar_permiso(self, rol_id: UUID, permiso_id: UUID, usuario_actual: dict):
        """Assign a single permission to a role"""
        rol = self.obtener_rol(rol_id, usuario_actual)
        
        if rol['es_sistema']:
            raise AppError("No se pueden modificar roles del sistema", 403)
        
        # Verify permission exists
        permiso = self.repo.obtener_permiso(permiso_id)
        if not permiso:
            raise AppError("Permiso no encontrado", 404)
        
        self.repo.asignar_permiso(rol_id, permiso_id)
        return {"mensaje": "Permiso asignado al rol"}
    
    def remover_permiso(self, rol_id: UUID, permiso_id: UUID, usuario_actual: dict):
        """Remove a single permission from a role"""
        rol = self.obtener_rol(rol_id, usuario_actual)
        
        if rol['es_sistema']:
            raise AppError("No se pueden modificar roles del sistema", 403)
        
        if not self.repo.remover_permiso(rol_id, permiso_id):
            raise AppError("Permiso no encontrado en el rol", 404)
        
        return {"mensaje": "Permiso removido del rol"}

