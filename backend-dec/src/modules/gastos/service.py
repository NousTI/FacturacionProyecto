from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioGastos
from .schemas import GastoCreacion, GastoActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioGastos:
    def __init__(self, repo: RepositorioGastos = Depends()):
        self.repo = repo

    def crear_gasto(self, datos: GastoCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if not datos.empresa_id:
                raise AppError("Superadmin debe especificar empresa_id", 400, "VAL_ERROR")
            empresa_id = datos.empresa_id
        else:
            empresa_id = usuario_actual.get("empresa_id")
            if not empresa_id:
                 raise AppError("Usuario no asociado a una empresa", 403, "AUTH_FORBIDDEN")
            datos.empresa_id = empresa_id

        usuario_id = datos.usuario_id or usuario_actual.get('id')
        if not usuario_id:
             raise AppError("No se pudo determinar el ID del usuario creador", 400, "VAL_ERROR")

        if not self.repo.validar_usuario_empresa(usuario_id, empresa_id):
             raise AppError("El usuario especificado no pertenece a la empresa indicada", 400, "VAL_ERROR")

        payload = datos.model_dump()
        payload['usuario_id'] = usuario_id
        
        try:
            nuevo = self.repo.crear_gasto(payload)
            if not nuevo:
                raise AppError("Error al registrar gasto", 500, "DB_ERROR")
            return nuevo
        except Exception as e:
            error_msg = str(e).lower()
            if "foreign key constraint" in error_msg:
                if "categoria_gasto" in error_msg:
                    raise AppError("La categoría de gasto especificada no existe", 400, "VAL_ERROR")
                if "proveedor" in error_msg:
                    raise AppError("El proveedor especificado no existe", 400, "VAL_ERROR")
            raise e

    def obtener_gasto(self, id: UUID, usuario_actual: dict):
        gasto = self.repo.obtener_por_id(id)
        if not gasto:
            raise AppError("Gasto no encontrado", 404, "GASTO_NOT_FOUND")
            
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            if str(gasto['empresa_id']) != str(usuario_actual['empresa_id']):
                 raise AppError("No tiene acceso a este gasto", 403, "AUTH_FORBIDDEN")
                 
        return gasto

    def listar_gastos(self, usuario_actual: dict, empresa_id: Optional[UUID] = None):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if empresa_id:
                return self.repo.listar_por_empresa(empresa_id)
            return self.repo.listar_todos()
            
        target_empresa_id = usuario_actual.get("empresa_id")
        return self.repo.listar_por_empresa(target_empresa_id)

    def actualizar_gasto(self, id: UUID, datos: GastoActualizacion, usuario_actual: dict):
        self.obtener_gasto(id, usuario_actual)
        
        try:
            payload = datos.model_dump(exclude_unset=True)
            if not payload: return self.repo.obtener_por_id(id)
            
            actualizado = self.repo.actualizar_gasto(id, payload)
            if not actualizado:
                 raise AppError("Error al actualizar el gasto", 500, "DB_ERROR")
            return actualizado
        except Exception as e:
            error_msg = str(e).lower()
            if "foreign key constraint" in error_msg:
                if "categoria_gasto" in error_msg:
                    raise AppError("La categoría de gasto especificada no existe", 400, "VAL_ERROR")
                if "proveedor" in error_msg:
                     raise AppError("El proveedor especificado no existe", 400, "VAL_ERROR")
            raise e

    def eliminar_gasto(self, id: UUID, usuario_actual: dict):
        self.obtener_gasto(id, usuario_actual)
        if not self.repo.eliminar_gasto(id):
            raise AppError("No se pudo eliminar el gasto", 500, "DB_ERROR")
        return True
