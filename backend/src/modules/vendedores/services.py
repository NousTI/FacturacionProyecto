from fastapi import Depends, Request
from uuid import UUID
from typing import List, Optional
import logging

from .repositories import RepositorioVendedores
from ..empresas.repositories import RepositorioEmpresas
from ..usuarios.repositories import RepositorioUsuarios
from .schemas import VendedorCreacion, VendedorActualizacion, ReasignacionEmpresas, VendedorPerfilActualizacion
from ..usuarios.schemas import CambioPassword
from ...utils.password import get_password_hash
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError
from ..logs.service import ServicioLogs

from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages

logger = logging.getLogger("facturacion_api")

class ServicioVendedores:
    def __init__(self, repo: RepositorioVendedores = Depends(),        repo_empresa: RepositorioEmpresas = Depends(), 
        repo_usuarios: RepositorioUsuarios = Depends(),
        logs_service: ServicioLogs = Depends()
    ):
        self.repo = repo
        self.repo_empresa = repo_empresa
        self.repo_usuarios = repo_usuarios
        self.logs_service = logs_service

    def _sanitize(self, vendedor: dict) -> dict:
        if not vendedor: return None
        vendedor.pop("password_hash", None)
        return vendedor

    def crear_vendedor(self, datos: VendedorCreacion, usuario_actual: dict, request: Request):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError(
                message=AppMessages.PERM_FORBIDDEN, 
                status_code=403, 
                code=ErrorCodes.PERM_FORBIDDEN
            )
            
        import uuid
        import unicodedata
        import re
        from urllib.parse import urlparse

        # Get domain from request
        domain = request.headers.get("origin")
        if domain:
            domain_name = urlparse(domain).hostname
        else:
            domain_name = request.url.hostname
        if not domain_name:
            domain_name = "nousesaas.com"
            
        if "." not in domain_name:
            domain_name = f"{domain_name}.com"

        # clean name for email
        def _clean_str(s):
            if not s: return ""
            s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
            s = s.lower()
            return re.sub(r'[^a-z0-9]', '', s)
            
        # Dynamically generate email to not allow frontend email
        base_name = _clean_str(datos.nombres.split()[0]) if datos.nombres else "vendedor"
        base_last = _clean_str(datos.apellidos.split()[0]) if getattr(datos, 'apellidos', None) else ""
        random_str = uuid.uuid4().hex[:4]
        
        prefix = f"{base_name}.{base_last}" if base_last else base_name
        datos.email = f"{prefix}.{random_str}@{domain_name}"
        
        # Check if email already exists in users table
        if self.repo_usuarios.obtener_por_correo(datos.email):
             raise AppError(
                 message="Email Duplicado", 
                 status_code=400, 
                 code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                 description="El correo electrónico ya está registrado.",
                 level="WARNING"
             )
        
        # 1. Preparar credenciales del usuario
        if not datos.password:
            raise AppError("La contraseña es obligatoria para crear un nuevo vendedor", 400)
        password = datos.password
        
        user_data = {
            "email": datos.email,
            "password_hash": get_password_hash(password),
            "role": "VENDEDOR",
            "estado": "ACTIVA"
        }
        user = self.repo_usuarios.crear_auth_user(user_data)
        
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
        vendedor = self.repo.obtener_por_id(id)
        if not vendedor: 
             raise AppError(
                 message=AppMessages.AUTH_USER_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.AUTH_USER_NOT_FOUND,
                 level="WARNING"
             )
             
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_owner = str(vendedor.get('user_id')) == str(usuario_actual.get('id'))
        
        if not is_superadmin and not is_owner:
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
            
        return self._sanitize(vendedor)

    def obtener_mi_perfil(self, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_VENDEDOR):
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
        vendedor = self.repo.obtener_por_user_id(usuario_actual.get('id'))
        if not vendedor:
             raise AppError(
                 message=AppMessages.AUTH_USER_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.AUTH_USER_NOT_FOUND
             )
        return self._sanitize(self.repo.obtener_por_id(vendedor['id']))

    def cambiar_password(self, data: CambioPassword, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_VENDEDOR):
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
        user_id = usuario_actual.get('id')
        vendedor = self.repo.obtener_por_user_id(user_id)
        if not vendedor:
             raise AppError(
                 message=AppMessages.AUTH_USER_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.AUTH_USER_NOT_FOUND
             )

        hashed_password = get_password_hash(data.nueva_password)
        if not self.repo_usuarios.actualizar_password(user_id, hashed_password):
            raise AppError("No se pudo actualizar la contraseña", 500)
        
        self.logs_service.registrar_evento(
            user_id=user_id,
            evento='PASSWORD_CAMBIADA',
            detail=f"Vendedor {usuario_actual.get('email')} cambió su contraseña",
            origen='USUARIO'
        )
        
        return {"mensaje": "Contraseña actualizada correctamente"}

    def actualizar_mi_perfil(self, datos: VendedorPerfilActualizacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_VENDEDOR):
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
        vendedor = self.repo.obtener_por_user_id(usuario_actual.get('id'))
        if not vendedor:
             raise AppError(
                 message=AppMessages.AUTH_USER_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.AUTH_USER_NOT_FOUND
             )
        datos_dict = datos.model_dump(exclude_unset=True)
        self.repo.actualizar(vendedor['id'], datos_dict)
        return self._sanitize(self.repo.obtener_por_id(vendedor['id']))

    def actualizar_vendedor(self, id: UUID, datos: VendedorActualizacion, usuario_actual: dict):
        vendedor = self.repo.obtener_por_id(id)
        if not vendedor: 
             raise AppError(
                 message=AppMessages.AUTH_USER_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.AUTH_USER_NOT_FOUND
             )

        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN)
        is_owner = str(vendedor.get('user_id')) == str(usuario_actual.get('id'))
        
        if not is_superadmin and not is_owner:
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
        
        datos_dict = datos.model_dump(exclude_unset=True)
        
        if is_owner and not is_superadmin:
            # Si es únicamente el vendedor, solo puede editar su nombre y teléfono
            allowed_fields = {'nombres', 'apellidos', 'telefono'}
            for k in list(datos_dict.keys()):
                if k not in allowed_fields:
                    del datos_dict[k]
            
            if not datos_dict:
                return self._sanitize(vendedor)

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
        
        v_orig = self.repo.obtener_por_id(id)
        v_dest = self.repo.obtener_por_id(id_destino)

        # No registramos en users_logs porque esa tabla es solo para eventos de autenticación

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

    def obtener_home_data(self, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_VENDEDOR):
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
        vendedor = self.repo.obtener_por_user_id(usuario_actual.get('id'))
        if not vendedor:
             raise AppError(
                 message=AppMessages.AUTH_USER_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.AUTH_USER_NOT_FOUND
             )
        return self.repo.obtener_home_data(vendedor['id'])
