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

    def _get_context(self, current_user: dict):
        return {
            "is_superadmin": current_user.get(AuthKeys.IS_SUPERADMIN, False),
            "is_vendedor": current_user.get(AuthKeys.IS_VENDEDOR, False),
            "is_usuario": current_user.get(AuthKeys.IS_USUARIO, False),
            "user_id": current_user.get("id"),
            "empresa_id": current_user.get("empresa_id")
        }

    def listar_proveedores(self, usuario_actual: dict, empresa_id_filtro: Optional[UUID] = None):
        ctx = self._get_context(usuario_actual)

        # 1. Usuario Regular (Admin Empresa): Solo ve proveedores de su propia empresa
        if ctx["is_usuario"]:
            if not ctx["empresa_id"]:
                 raise AppError("Usuario no tiene empresa asignada", 400, "VAL_ERROR")
            return self.repo.listar_proveedores(empresa_id=ctx["empresa_id"])

        # 2. Superadmin: Puede ver de cualquier empresa (filtro opcional)
        if ctx["is_superadmin"]:
            return self.repo.listar_proveedores(empresa_id=empresa_id_filtro)
            
        # 3. Vendedor: Solo ve proveedores de empresas (por ahora requiere filtro)
        if ctx["is_vendedor"]:
            if not empresa_id_filtro:
                 raise AppError("Vendedor debe especificar empresa_id", 400, "VAL_ERROR")
            return self.repo.listar_proveedores(empresa_id=empresa_id_filtro)

        raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")

    def obtener_proveedor(self, proveedor_id: UUID, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        proveedor = self.repo.obtener_por_id(proveedor_id)
        
        if not proveedor:
            raise AppError("Proveedor no encontrado", 404, "PROVEEDOR_NOT_FOUND")
        
        # Validar acceso
        if ctx["is_usuario"]:
             if str(proveedor['empresa_id']) != str(ctx["empresa_id"]):
                  raise AppError("No tienes acceso a este proveedor", 403, "AUTH_FORBIDDEN")
        
        # Superadmin/Vendedor pueden verlo si ya lo encontraron (id válido)
        # pero se podría añadir validación extra aquí similar a clientes si fuera necesario

        return proveedor

    def crear_proveedor(self, datos: ProveedorCreacion, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        
        # Determinar empresa_id
        if ctx["is_usuario"]:
            if not ctx["empresa_id"]:
                 raise AppError("Usuario no asociado a una empresa", 400, "VAL_ERROR")
            empresa_id = ctx["empresa_id"]
        elif ctx["is_superadmin"] or ctx["is_vendedor"]:
            if not datos.empresa_id:
                raise AppError("Debe especificar empresa_id", 400, "VAL_ERROR")
            empresa_id = datos.empresa_id
        else:
            raise AppError("No autorizado para crear proveedores", 403, "AUTH_FORBIDDEN")

        if self.repo.identificacion_existe(datos.identificacion, empresa_id):
             raise AppError("Ya existe un proveedor con esta identificación en la empresa", 409, "PROVEEDOR_EXISTS")

        payload = datos.model_dump()
        payload["empresa_id"] = empresa_id
        
        return self.repo.crear_proveedor(payload)

    def actualizar_proveedor(self, proveedor_id: UUID, datos: ProveedorActualizacion, usuario_actual: dict):
        existing = self.obtener_proveedor(proveedor_id, usuario_actual) # Valida permisos y existencia
            
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
        self.obtener_proveedor(proveedor_id, usuario_actual) # Valida permisos
        if not self.repo.eliminar_proveedor(proveedor_id):
             raise AppError("Error al eliminar proveedor", 500, "DB_ERROR")
        return True

    def toggle_activo(self, proveedor_id: UUID, usuario_actual: dict):
        self.obtener_proveedor(proveedor_id, usuario_actual)  # Valida permisos y existencia
        updated = self.repo.toggle_activo(proveedor_id)
        if not updated:
            raise AppError("Error al cambiar estado del proveedor", 500, "DB_ERROR")
        return updated
