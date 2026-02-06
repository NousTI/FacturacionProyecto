from fastapi import Depends
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional
import logging

from .repositories import RepositorioEmpresas
from ..vendedores.repositories import RepositorioVendedores
from ..empresa_roles.services import ServicioRoles
from .schemas import EmpresaCreacion, EmpresaActualizacion
from ...constants.enums import AuthKeys, SubscriptionStatus
from ...errors.app_error import AppError

from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages

logger = logging.getLogger("facturacion_api")

class ServicioEmpresas:
    def __init__(
        self, 
        repo: RepositorioEmpresas = Depends(), 
        vendedor_repo: RepositorioVendedores = Depends(),
        roles_service: ServicioRoles = Depends()
    ):
        self.repo = repo
        self.vendedor_repo = vendedor_repo
        self.roles_service = roles_service

    def _get_context(self, current_user: dict):
        ctx = {
            "is_superadmin": current_user.get(AuthKeys.IS_SUPERADMIN, False),
            "is_vendedor": current_user.get(AuthKeys.IS_VENDEDOR, False),
            "is_usuario": current_user.get(AuthKeys.IS_USUARIO, False),
            "user_id": current_user.get("id"),
            "empresa_id": current_user.get("empresa_id"),
            "vendedor_id": None
        }
        
        if ctx["is_vendedor"]:
             vendedor_profile = self.vendedor_repo.obtener_por_user_id(ctx["user_id"])
             if vendedor_profile:
                 ctx["vendedor_id"] = vendedor_profile["id"]
                 
        return ctx

    def crear_empresa(self, datos: EmpresaCreacion, usuario_actual: dict):
        logger.info(f"[CREAR] Iniciando creación de empresa - RUC: {datos.ruc}")
        ctx = self._get_context(usuario_actual)

        if not ctx["is_superadmin"] and not ctx["is_vendedor"]:
             logger.warning("[VALIDACIÓN] Usuario sin permisos para crear empresa")
             raise AppError(
                 message="Acceso Denegado", 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN,
                 description="No tienes permisos suficientes para registrar nuevas empresas."
             )

        if self.repo.obtener_por_ruc(datos.ruc):
             logger.warning(f"[VALIDACIÓN] RUC duplicado: {datos.ruc}")
             raise AppError(
                 message="RUC Duplicado", 
                 status_code=400, 
                 code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                 description="El RUC ingresado ya se encuentra registrado en el sistema.",
                 level="WARNING"
             )
        
        payload = datos.model_dump()

        if not ctx["is_superadmin"]:
            if not ctx["vendedor_id"]:
                  raise AppError(
                      message=AppMessages.PERM_FORBIDDEN, 
                      status_code=403, 
                      code=ErrorCodes.PERM_FORBIDDEN,
                      description="No se encontró un perfil de vendedor asociado a tu cuenta."
                  )
            payload['vendedor_id'] = ctx["vendedor_id"]
            
        try:
             nueva = self.repo.crear_empresa(payload)
             logger.info(f"[ÉXITO] Empresa creada - ID: {nueva['id']}, RUC: {nueva['ruc']}")
             # Inicializar roles y permisos por defecto
             self._inicializar_empresa_roles(nueva['id'])
             logger.info(f"[CREAR] Roles inicializados para empresa: {nueva['id']}")
             return nueva
        except Exception as e:
             logger.error(f"[ERROR] Fallo al crear empresa: {str(e)}")
             if "vendedor_id" in str(e) and "viol" in str(e):
                  raise AppError(
                      message=AppMessages.VAL_INVALID_INPUT, 
                      status_code=400, 
                      code=ErrorCodes.VAL_INVALID_INPUT,
                      description="ID de Vendedor inválido"
                  )
             raise e

    def obtener_empresa(self, empresa_id: UUID, usuario_actual: dict):
        logger.info(f"[INICIO] Obteniendo empresa: {empresa_id}")
        empresa = self.repo.obtener_por_id(empresa_id)
        if not empresa:
             logger.warning(f"[VALIDACIÓN] Empresa no encontrada: {empresa_id}")
             raise AppError(
                 message=AppMessages.DB_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.DB_NOT_FOUND,
                 description="La empresa solicitada no existe."
             )
        
        ctx = self._get_context(usuario_actual)
        
        if ctx["is_superadmin"]:
            logger.info(f"[ÉXITO] Empresa obtenida - ID: {empresa_id}")
            return empresa
        
        if ctx["is_vendedor"]:
            if str(empresa.get('vendedor_id')) != str(ctx["vendedor_id"]):
                 raise AppError(
                     message=AppMessages.PERM_FORBIDDEN, 
                     status_code=403, 
                     code=ErrorCodes.PERM_FORBIDDEN
                 )
            return empresa

        if ctx["is_usuario"]:
             if str(empresa_id) != str(ctx["empresa_id"]):
                  raise AppError(
                      message=AppMessages.PERM_FORBIDDEN, 
                      status_code=403, 
                      code=ErrorCodes.PERM_FORBIDDEN
                  )
             return empresa
             
        raise AppError(
            message=AppMessages.PERM_FORBIDDEN, 
            status_code=403, 
            code=ErrorCodes.PERM_FORBIDDEN,
            description="Rol no autorizado para ver esta información"
        )
        
    def get_empresa(self, empresa_id: UUID, usuario_actual: dict):
        # Alias for legacy compatibility if needed, or internal use
        return self.obtener_empresa(empresa_id, usuario_actual)

    def listar_empresas(self, usuario_actual: dict, vendedor_id: Optional[UUID] = None):
        logger.info("[INICIO] Listando empresas")
        ctx = self._get_context(usuario_actual)
        
        if ctx["is_superadmin"]:
            result = self.repo.listar_empresas(vendedor_id=vendedor_id)
            logger.info(f"[ÉXITO] Empresas listadas: {len(result)} registros")
            return result

        if ctx["is_vendedor"]:
             # Si envia un vendedor_id diferente al suyo, bloquearlo
             if vendedor_id and str(vendedor_id) != str(ctx["vendedor_id"]):
                  logger.warning(f"[VALIDACIÓN] Intento de acceso a empresas de otro vendedor")
                  raise AppError(
                      message=AppMessages.PERM_FORBIDDEN, 
                      status_code=403, 
                      code=ErrorCodes.PERM_FORBIDDEN,
                      description="No puedes ver empresas de otros vendedores"
                  )
             return self.repo.listar_empresas(vendedor_id=ctx["vendedor_id"])

        if ctx["is_usuario"]:
            if not ctx["empresa_id"]: return []
            return self.repo.listar_empresas(empresa_id=ctx["empresa_id"])
            
        raise AppError(
            message=AppMessages.PERM_FORBIDDEN, 
            status_code=403, 
            code=ErrorCodes.PERM_FORBIDDEN
        )

    def obtener_estadisticas(self, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        
        if ctx["is_superadmin"]:
            return self.repo.obtener_estadisticas()
            
        if ctx["is_vendedor"]:
            return self.repo.obtener_estadisticas(vendedor_id=ctx["vendedor_id"])
            
        raise AppError(
            message=AppMessages.PERM_FORBIDDEN, 
            status_code=403, 
            code=ErrorCodes.PERM_FORBIDDEN,
            description="No tienes permiso para ver estadísticas"
        )

    def list_empresas(self, usuario_actual: dict, vendedor_id: Optional[UUID] = None):
        # Alias
        return self.listar_empresas(usuario_actual, vendedor_id)

    def actualizar_empresa(self, empresa_id: UUID, datos: EmpresaActualizacion, usuario_actual: dict):
        logger.info(f"[EDITAR] Iniciando actualización de empresa: {empresa_id}")
        ctx = self._get_context(usuario_actual)
        current = self.obtener_empresa(empresa_id, usuario_actual)
        
        payload = datos.model_dump(exclude_unset=True)
        
        if 'ruc' in payload and payload['ruc'] != current['ruc']:
             if self.repo.obtener_por_ruc(payload['ruc']):
                 logger.warning(f"[VALIDACIÓN] RUC duplicado en actualización: {payload['ruc']}")
                 raise AppError(
                     message="RUC Duplicado", 
                     status_code=400, 
                     code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                     description="No se puede actualizar el RUC porque ya pertenece a otra empresa.",
                     level="WARNING"
                 )
                 
        if not ctx["is_superadmin"]:
            # Si es vendedor, NO tiene permiso de editar datos generales de la empresa
            # Solo puede cambiar plan o toggle active (via otros endpoints)
            if ctx["is_vendedor"]:
                 logger.warning(f"[VALIDACIÓN] Vendedor intentó editar datos de empresa")
                 raise AppError(
                     message=AppMessages.PERM_FORBIDDEN, 
                     status_code=403, 
                     code=ErrorCodes.PERM_FORBIDDEN,
                     description="No tienes permisos para editar los datos fiscales o de contacto de la empresa."
                 )

            if 'activo' in payload and payload['activo'] != current['activo']:
                 logger.warning(f"[VALIDACIÓN] Usuario sin permisos para cambiar estado active")
                 raise AppError(
                     message=AppMessages.PERM_FORBIDDEN, 
                     status_code=403, 
                     code=ErrorCodes.PERM_FORBIDDEN,
                     description="Solo Superadmin puede cambiar estado activo"
                 )

        self.repo.actualizar_empresa(empresa_id, payload)
        logger.info(f"[ÉXITO] Empresa actualizada - ID: {empresa_id}")
        return self.obtener_empresa(empresa_id, usuario_actual)

    def eliminar_empresa(self, empresa_id: UUID, usuario_actual: dict):
        logger.info(f"[ELIMINAR] Iniciando eliminación de empresa: {empresa_id}")
        self.obtener_empresa(empresa_id, usuario_actual)
        ctx = self._get_context(usuario_actual)
        
        if ctx["is_usuario"]:
             logger.warning("[VALIDACIÓN] Usuario regular intentó eliminar empresa")
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
             
        if not self.repo.eliminar_empresa(empresa_id):
             logger.error(f"[ERROR] Fallo al eliminar empresa: {empresa_id}")
             raise AppError(
                 message=AppMessages.SYS_INTERNAL_ERROR, 
                 status_code=500, 
                 code=ErrorCodes.DB_QUERY_ERROR,
                 description="Error al eliminar empresa"
             )
        logger.info(f"[ÉXITO] Empresa eliminada - ID: {empresa_id}")
        return True

    def toggle_active(self, empresa_id: UUID, usuario_actual: dict):
        logger.info(f"[EDITAR] Alternando estado activo de empresa: {empresa_id}")
        ctx = self._get_context(usuario_actual)
        if not ctx["is_superadmin"]:
             logger.warning("[VALIDACIÓN] Usuario sin permisos para cambiar estado active")
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
             
        empresa = self.repo.obtener_por_id(empresa_id)
        if not empresa: 
             logger.warning(f"[VALIDACIÓN] Empresa no encontrada: {empresa_id}")
             raise AppError(
                 message=AppMessages.DB_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.DB_NOT_FOUND
             )
        
        new_status = not empresa.get("activo", True)
        self.repo.actualizar_empresa(empresa_id, {"activo": new_status})
        logger.info(f"[ÉXITO] Estado activo cambiado a {new_status} - ID: {empresa_id}")
        return self.obtener_empresa(empresa_id, usuario_actual)

    def assign_vendor(self, empresa_id: UUID, vendedor_id: Optional[UUID], usuario_actual: dict):
        logger.info(f"[EDITAR] Asignando vendedor a empresa: {empresa_id}")
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            logger.warning("[VALIDACIÓN] Usuario sin permisos para asignar vendedor")
            raise AppError(AppMessages.PERM_FORBIDDEN, 403, ErrorCodes.PERM_FORBIDDEN)
        
        current = self.obtener_empresa(empresa_id, usuario_actual)
        current_vendedor_id = current.get('vendedor_id')
        
        # Estabilizar comparación (UUID -> string / None)
        curr_id_str = str(current_vendedor_id) if current_vendedor_id else None
        new_id_str = str(vendedor_id) if vendedor_id else None
        
        if curr_id_str == new_id_str:
            logger.warning(f"[VALIDACIÓN] Vendedor ya asignado a empresa")
            raise AppError(
                message="Vendedor ya asignado",
                status_code=400,
                code=ErrorCodes.VAL_INVALID_INPUT,
                description="La empresa ya tiene este vendedor/gestión asignado."
            )

        try:
             self.repo.asignar_vendedor(empresa_id, vendedor_id)
             logger.info(f"[ÉXITO] Vendedor asignado a empresa - empresa ID: {empresa_id}, vendedor ID: {vendedor_id}")
             return self.obtener_empresa(empresa_id, usuario_actual)
        except Exception as e:
             logger.error(f"[ERROR] Fallo al asignar vendedor: {str(e)}")
             raise AppError(
                 message=AppMessages.VAL_INVALID_INPUT, 
                 status_code=400, 
                 code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                 description="Error al asignar vendedor (ID inválido o inexistente)"
             )

    def _inicializar_empresa_roles(self, empresa_id: UUID):
        """Crea el rol de Administrador con todos los permisos para la nueva empresa"""
        try:
            # 1. Obtener todos los permisos del catálogo
            permisos = self.roles_service.listar_permisos()
            permiso_ids = [p['id'] for p in permisos]

            # 2. Crear el rol de Administrador
            rol_data = {
                "nombre": "Administrador de Empresa",
                "descripcion": "Rol con todos los permisos del sistema",
                "es_sistema": True
            }

            # Usamos el repositorio directamente para evitar chequeos de contexto
            self.roles_service.repo.crear_rol(empresa_id, rol_data, permiso_ids)
            
        except Exception as e:
            print(f"Error al inicializar roles para la empresa {empresa_id}: {str(e)}")
