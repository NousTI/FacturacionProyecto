from fastapi import Depends
from uuid import UUID
from typing import List, Optional

from .repository import RepositorioUsuarios
from .schemas import UsuarioCreacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ...utils.password import get_password_hash

# Modulo Import
from ..empresa.service import ServicioEmpresa

from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages

class ServicioUsuarios:
    def __init__(self, repo: RepositorioUsuarios = Depends(), empresa_service: ServicioEmpresa = Depends()):
        self.repo = repo
        self.empresa_service = empresa_service

    def _get_contexto(self, usuario_actual: dict):
        return {
            "is_superadmin": usuario_actual.get(AuthKeys.IS_SUPERADMIN, False),
            "is_vendedor": usuario_actual.get(AuthKeys.IS_VENDEDOR, False),
            "is_usuario": usuario_actual.get(AuthKeys.IS_USUARIO, False),
            "user_id": usuario_actual.get("id"),
            "empresa_id": usuario_actual.get("empresa_id")
        }

    def _sanitize(self, usuario: dict) -> dict:
        if not usuario: return None
        safe = usuario.copy()
        safe.pop("password", None)
        safe.pop("password_hash", None)
        
        # Mapeo reverso si el schema usa 'correo' pero la DB devuelve 'email'
        if 'email' in safe and 'correo' not in safe:
            safe['correo'] = safe['email']
            
        return safe

    def crear_usuario(self, datos: UsuarioCreacion, usuario_actual: dict):
        ctx = self._get_contexto(usuario_actual)
        
        if self.repo.obtener_por_correo(datos.correo):
             raise AppError(
                 message="El correo electrónico ya se encuentra registrado.", 
                 status_code=400, 
                 code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                 level="WARNING"
             )

        # Validaciones de permisos (igual que legacy)
        if ctx["is_usuario"]:
            if str(datos.empresa_id) != str(ctx["empresa_id"]):
                 raise AppError(
                     message=AppMessages.PERM_FORBIDDEN, 
                     status_code=403, 
                     code=ErrorCodes.PERM_FORBIDDEN,
                     description="No puedes crear usuarios para otra empresa"
                 )

        if ctx["is_vendedor"]:
             # Valida propiedad de empresa
             self.empresa_service.get_empresa(datos.empresa_id, usuario_actual)

        # Preparar datos DB
        db_data = datos.model_dump()
        db_data["email"] = db_data.pop("correo") # Map correo -> email
        clave = db_data.pop("clave")
        db_data["password_hash"] = get_password_hash(clave)
        
        nuevo = self.repo.crear_usuario(db_data)
        return self._sanitize(nuevo)

    def listar_usuarios(self, usuario_actual: dict):
        ctx = self._get_contexto(usuario_actual)
        
        usuarios = []
        if ctx["is_superadmin"]:
             usuarios = self.repo.listar_usuarios()
        elif ctx["is_vendedor"]:
             empresas = self.empresa_service.list_empresas(usuario_actual, vendedor_id=ctx["user_id"])
             for emp in empresas:
                 usuarios.extend(self.repo.listar_usuarios(empresa_id=emp['id']))
        elif ctx["is_usuario"]:
             if not ctx["empresa_id"]: return []
             usuarios = self.repo.listar_usuarios(empresa_id=ctx["empresa_id"])
        else:
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
             
        return [self._sanitize(u) for u in usuarios]

    def obtener_usuario(self, user_id: UUID, usuario_actual: dict):
        user = self.repo.obtener_por_id(user_id)
        if not user:
             raise AppError(
                 message=AppMessages.AUTH_USER_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.AUTH_USER_NOT_FOUND,
                 level="WARNING"
             )
             
        # Logica de visibilidad (simplificada pero segura)
        ctx = self._get_contexto(usuario_actual)
        
        if ctx["is_superadmin"]:
            return self._sanitize(user)
        if str(ctx["user_id"]) == str(user_id):
            return self._sanitize(user)
        if ctx["is_usuario"] and str(user.get("empresa_id")) == str(ctx["empresa_id"]):
             return self._sanitize(user)
             
        # Vendedor check
        if ctx["is_vendedor"]:
             self.empresa_service.get_empresa(user["empresa_id"], usuario_actual)
             return self._sanitize(user)
             
        raise AppError(
            message=AppMessages.PERM_FORBIDDEN, 
            status_code=403, 
            code=ErrorCodes.PERM_FORBIDDEN,
            description="No tienes permiso para ver este usuario"
        )

    def actualizar_usuario(self, user_id: UUID, datos: dict, usuario_actual: dict):
        # Verificar existencia y acceso
        target = self.obtener_usuario(user_id, usuario_actual)
        
        # Mapeo frontend -> DB
        if 'correo' in datos:
            datos['email'] = datos.pop('correo')
            
        # Actualizar
        updated = self.repo.actualizar_usuario(user_id, datos)
        return self._sanitize(updated)

    def eliminar_usuario(self, user_id: UUID, usuario_actual: dict):
        self.obtener_usuario(user_id, usuario_actual) # check visibility
        if usuario_actual.get(AuthKeys.IS_USUARIO):
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
             
        return self.repo.eliminar_usuario(user_id)
