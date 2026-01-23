from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioVendedores
from ..empresa.repository import RepositorioEmpresa
from .schemas import VendedorCreacion, VendedorActualizacion, ReasignacionEmpresas
from ...utils.password import get_password_hash
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages

class ServicioVendedores:
    def __init__(self, repo: RepositorioVendedores = Depends(), repo_empresa: RepositorioEmpresa = Depends()):
        self.repo = repo
        self.repo_empresa = repo_empresa

    def _sanitize(self, vendedor: dict) -> dict:
        if not vendedor: return None
        vendedor.pop("password_hash", None)
        return vendedor

    def crear_vendedor(self, datos: VendedorCreacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError(
                message=AppMessages.PERM_FORBIDDEN, 
                status_code=403, 
                code=ErrorCodes.PERM_FORBIDDEN
            )
            
        if self.repo.obtener_por_email(datos.email):
             raise AppError(
                 message="Email Duplicado", 
                 status_code=400, 
                 code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                 description="El correo electrónico ya está registrado por otro vendedor.",
                 level="WARNING"
             )
        
        hash_pwd = get_password_hash(datos.password)
        datos_dict = datos.model_dump(exclude={"password"})
        res = self.repo.crear(datos_dict, hash_pwd)
        return self._sanitize(res)

    def listar_vendedores(self, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError(
                message=AppMessages.PERM_FORBIDDEN, 
                status_code=403, 
                code=ErrorCodes.PERM_FORBIDDEN
            )
        return [self._sanitize(v) for v in self.repo.listar_todos()]

    def obtener_vendedor(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and str(usuario_actual.get('id')) != str(id):
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
            
        vendedor = self.repo.obtener_por_id(id)
        if not vendedor: 
             raise AppError(
                 message=AppMessages.AUTH_USER_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.AUTH_USER_NOT_FOUND,
                 level="WARNING"
             )
        return self._sanitize(vendedor)

    def actualizar_vendedor(self, id: UUID, datos: VendedorActualizacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and str(usuario_actual.get('id')) != str(id):
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
            
        vendedor = self.repo.obtener_por_id(id)
        if not vendedor: 
             raise AppError(
                 message=AppMessages.AUTH_USER_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.AUTH_USER_NOT_FOUND
             )
        
        datos_dict = datos.model_dump(exclude_unset=True)
        if 'password' in datos_dict:
            datos_dict['password_hash'] = get_password_hash(datos_dict.pop('password'))
            
        res = self.repo.actualizar(id, datos_dict)
        return self._sanitize(res)

    def obtener_stats_vendedores(self, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError(
                message=AppMessages.PERM_FORBIDDEN, 
                status_code=403, 
                code=ErrorCodes.PERM_FORBIDDEN
            )
        return self.repo.obtener_stats_globales()

    def toggle_status_vendedor(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError(
                message=AppMessages.PERM_FORBIDDEN, 
                status_code=403, 
                code=ErrorCodes.PERM_FORBIDDEN
            )
        res = self.repo.toggle_status(id)
        if not res:
            raise AppError(
                message=AppMessages.AUTH_USER_NOT_FOUND, 
                status_code=404, 
                code=ErrorCodes.AUTH_USER_NOT_FOUND
            )
        return self._sanitize(res)

    def reasignar_empresas_vendedor(self, id: UUID, datos: ReasignacionEmpresas, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError(
                message=AppMessages.PERM_FORBIDDEN, 
                status_code=403, 
                code=ErrorCodes.PERM_FORBIDDEN
            )
        
        id_destino = datos.vendedor_destino_id

        if id == id_destino:
            raise AppError(
                message="Operación Inválida",
                status_code=400,
                code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                description="No puedes reasignar empresas al mismo vendedor de origen."
            )
            
        # Verify both exist
        if not self.repo.obtener_por_id(id) or not self.repo.obtener_por_id(id_destino):
             raise AppError(
                message="Uno de los vendedores especificados no existe.", 
                status_code=404, 
                code=ErrorCodes.AUTH_USER_NOT_FOUND
            )
            
        count = self.repo.reasignar_empresas(id, id_destino, empresa_ids=datos.empresa_ids)
        return {"cantidad_reasignada": count, "message": f"Se reasignaron {count} empresas exitosamente."}

    def obtener_empresas_vendedor(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError(
                message=AppMessages.PERM_FORBIDDEN, 
                status_code=403, 
                code=ErrorCodes.PERM_FORBIDDEN
            )
        return self.repo_empresa.listar_empresas(vendedor_id=id)

    def eliminar_vendedor(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError(
                message=AppMessages.PERM_FORBIDDEN, 
                status_code=403, 
                code=ErrorCodes.PERM_FORBIDDEN
            )
        return self.repo.eliminar(id)
