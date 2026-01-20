from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioProveedores
from .schemas import ProveedorCreacion, ProveedorActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioProveedores:
    def __init__(self, repo: RepositorioProveedores = Depends()):
        self.repo = repo

    def listar_proveedores(self, usuario_actual: dict, empresa_id: Optional[UUID] = None):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        user_empresa_id = usuario_actual.get("empresa_id")

        if is_superadmin:
             target_empresa_id = empresa_id 
        else:
             if empresa_id and str(empresa_id) != str(user_empresa_id):
                   raise AppError("No puedes listar proveedores de otra empresa", 403, "AUTH_FORBIDDEN")
             target_empresa_id = user_empresa_id

        if not is_superadmin and not target_empresa_id:
             raise AppError("Usuario no asociado a una empresa", 400, "VAL_ERROR")

        return self.repo.listar_proveedores(target_empresa_id)

    def obtener_proveedor(self, proveedor_id: UUID, usuario_actual: dict):
        proveedor = self.repo.obtener_por_id(proveedor_id)
        if not proveedor:
            raise AppError("Proveedor no encontrado", 404, "PROVEEDOR_NOT_FOUND")
        
        user_empresa_id = usuario_actual.get("empresa_id")
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)

        if not is_superadmin and str(proveedor['empresa_id']) != str(user_empresa_id):
             raise AppError("No tienes acceso a este proveedor", 403, "AUTH_FORBIDDEN")

        return proveedor

    def crear_proveedor(self, datos: ProveedorCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if not datos.empresa_id:
                raise AppError("Superadmins deben especificar empresa_id", 400, "VAL_ERROR")
            empresa_id = datos.empresa_id
        else:
            if datos.empresa_id:
                 raise AppError("No tienes permisos para asignar manualmente la empresa", 403, "AUTH_FORBIDDEN")
            empresa_id = usuario_actual.get("empresa_id")
            if not empresa_id:
                 raise AppError("Usuario no asociado a una empresa", 400, "VAL_ERROR")
            datos.empresa_id = empresa_id

        if self.repo.identificacion_existe(datos.identificacion, empresa_id):
             raise AppError("Ya existe un proveedor con esta identificación en la empresa", 409, "PROVEEDOR_EXISTS")

        payload = datos.model_dump()
        payload["empresa_id"] = empresa_id
        
        return self.repo.crear_proveedor(payload)

    def actualizar_proveedor(self, proveedor_id: UUID, datos: ProveedorActualizacion, usuario_actual: dict):
        existing = self.obtener_proveedor(proveedor_id, usuario_actual)
            
        payload = datos.model_dump(exclude_unset=True)
        if not payload:
             return existing

        if 'identificacion' in payload and payload['identificacion'] != existing['identificacion']:
             empresa_id = existing['empresa_id']
             if self.repo.identificacion_existe(payload['identificacion'], empresa_id):
                  raise AppError("Ya existe un proveedor con esta identificación", 409, "PROVEEDOR_EXISTS")

        updated = self.repo.actualizar_proveedor(proveedor_id, payload)
        if not updated:
             raise AppError("Error al actualizar proveedor", 500, "DB_ERROR")
        return updated

    def eliminar_proveedor(self, proveedor_id: UUID, usuario_actual: dict):
        self.obtener_proveedor(proveedor_id, usuario_actual) 
        if not self.repo.eliminar_proveedor(proveedor_id):
             raise AppError("Error al eliminar proveedor", 500, "DB_ERROR")
        return True
