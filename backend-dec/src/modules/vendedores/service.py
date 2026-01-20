from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioVendedores
from .schemas import VendedorCreacion, VendedorActualizacion
from ...utils.security import get_password_hash
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioVendedores:
    def __init__(self, repo: RepositorioVendedores = Depends()):
        self.repo = repo

    def _sanitize(self, vendedor: dict) -> dict:
        if not vendedor: return None
        vendedor.pop("password_hash", None)
        return vendedor

    def crear_vendedor(self, datos: VendedorCreacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
            
        if self.repo.obtener_por_email(datos.email):
            raise AppError("El email ya está registrado", 400, "VENDEDOR_EXISTS")
        
        hash_pwd = get_password_hash(datos.password)
        datos_dict = datos.model_dump(exclude={"password"})
        res = self.repo.crear(datos_dict, hash_pwd)
        return self._sanitize(res)

    def listar_vendedores(self, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
        return [self._sanitize(v) for v in self.repo.listar_todos()]

    def obtener_vendedor(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and str(usuario_actual.get('id')) != str(id):
            raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            
        vendedor = self.repo.obtener_por_id(id)
        if not vendedor: raise AppError("Vendedor no encontrado", 404, "VENDEDOR_NOT_FOUND")
        return self._sanitize(vendedor)

    def actualizar_vendedor(self, id: UUID, datos: VendedorActualizacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and str(usuario_actual.get('id')) != str(id):
            raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            
        vendedor = self.repo.obtener_por_id(id)
        if not vendedor: raise AppError("Vendedor no encontrado", 404, "VENDEDOR_NOT_FOUND")
        
        datos_dict = datos.model_dump(exclude_unset=True)
        if 'password' in datos_dict:
            datos_dict['password_hash'] = get_password_hash(datos_dict.pop('password'))
            
        res = self.repo.actualizar(id, datos_dict)
        return self._sanitize(res)

    def eliminar_vendedor(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
        return self.repo.eliminar(id)
