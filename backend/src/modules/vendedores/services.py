from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repositories import RepositorioVendedores
from ..empresas.repositories import RepositorioEmpresas
from ..usuarios.repositories import RepositorioUsuarios
from .schemas import VendedorCreacion, VendedorActualizacion, ReasignacionEmpresas
from ...utils.password import get_password_hash
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages

class ServicioVendedores:
    def __init__(self, repo: RepositorioVendedores = Depends(), repo_empresa: RepositorioEmpresas = Depends(), repo_usuarios: RepositorioUsuarios = Depends()):
        self.repo = repo
        self.repo_empresa = repo_empresa
        self.repo_usuarios = repo_usuarios

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
        
        # Check if email already exists in users table
        if self.repo_usuarios.obtener_por_correo(datos.email):
             raise AppError(
                 message="Email Duplicado", 
                 status_code=400, 
                 code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                 description="El correo electrónico ya está registrado.",
                 level="WARNING"
             )
        
        # 1. Create user record in users table
        user_data = {
            "email": datos.email,
            "password": datos.password,  # Repository will convert to password_hash
            "role": "VENDEDOR",
            "estado": "ACTIVA"
        }
        user = self.repo_usuarios.crear_usuario(user_data)
        
        if not user:
            raise AppError(
                message="Error al crear usuario",
                status_code=500,
                code=ErrorCodes.SYS_INTERNAL_ERROR,
                description="No se pudo crear el usuario en el sistema de autenticación."
            )
        
        # 2. Create vendedor record with user_id
        datos_vendedor = datos.model_dump(exclude={"email", "password"})
        datos_vendedor["user_id"] = user["id"]
        
        vendedor = self.repo.crear(datos_vendedor)
        return self._sanitize(vendedor)

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
