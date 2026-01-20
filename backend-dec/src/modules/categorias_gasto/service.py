from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioCategoriasGasto
from .schemas import CategoriaGastoCreacion, CategoriaGastoActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioCategoriasGasto:
    def __init__(self, repo: RepositorioCategoriasGasto = Depends()):
        self.repo = repo

    def crear_categoria(self, datos: CategoriaGastoCreacion, usuario_actual: dict):
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

        try:
            nuevo = self.repo.crear_categoria(datos.model_dump())
            if not nuevo:
                raise AppError("Error al crear la categoría de gasto", 500, "DB_ERROR")
            return nuevo
        except Exception as e:
            if "unique constraint" in str(e).lower() and "codigo" in str(e).lower():
                raise AppError("Ya existe una categoría con este código para su empresa", 409, "CATEGORIA_EXISTS")
            raise e

    def obtener_categoria(self, id: UUID, usuario_actual: dict):
        categoria = self.repo.obtener_por_id(id)
        if not categoria:
            raise AppError("Categoría no encontrada", 404, "CATEGORIA_NOT_FOUND")
            
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            if str(categoria['empresa_id']) != str(usuario_actual['empresa_id']):
                 raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
                 
        return categoria

    def listar_categorias(self, usuario_actual: dict, empresa_id: Optional[UUID] = None):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if empresa_id:
                return self.repo.listar_por_empresa(empresa_id)
            return self.repo.listar_todas()
            
        target_empresa_id = usuario_actual.get("empresa_id")
        return self.repo.listar_por_empresa(target_empresa_id)

    def actualizar_categoria(self, id: UUID, datos: CategoriaGastoActualizacion, usuario_actual: dict):
        self.obtener_categoria(id, usuario_actual)
        
        try:
            payload = datos.model_dump(exclude_unset=True)
            if not payload: return self.repo.obtener_por_id(id)
            
            actualizado = self.repo.actualizar_categoria(id, payload)
            if not actualizado:
                 raise AppError("Error al actualizar categoría", 500, "DB_ERROR")
            return actualizado
        except Exception as e:
            if "unique constraint" in str(e).lower() and "codigo" in str(e).lower():
                raise AppError("El código ya está en uso", 409, "CATEGORIA_EXISTS")
            raise e

    def eliminar_categoria(self, id: UUID, usuario_actual: dict):
        self.obtener_categoria(id, usuario_actual)
        if not self.repo.eliminar_categoria(id):
            raise AppError("No se pudo eliminar la categoría", 500, "DB_ERROR")
        return True
