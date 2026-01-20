from fastapi import Depends
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional

from .repository import RepositorioEmpresa
from .schemas import EmpresaCreacion, EmpresaActualizacion
from ...constants.enums import AuthKeys, SubscriptionStatus
from ...errors.app_error import AppError

from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages

class ServicioEmpresa:
    def __init__(self, repo: RepositorioEmpresa = Depends()):
        self.repo = repo

    def _get_context(self, current_user: dict):
        return {
            "is_superadmin": current_user.get(AuthKeys.IS_SUPERADMIN, False),
            "is_vendedor": current_user.get(AuthKeys.IS_VENDEDOR, False),
            "is_usuario": current_user.get(AuthKeys.IS_USUARIO, False),
            "user_id": current_user.get("id"),
            "empresa_id": current_user.get("empresa_id")
        }

    def crear_empresa(self, datos: EmpresaCreacion, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)

        if not ctx["is_superadmin"] and not ctx["is_vendedor"]:
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN,
                 description="No autorizado para crear empresas"
             )

        if self.repo.obtener_por_ruc(datos.ruc):
             raise AppError(
                 message="El RUC ingresado ya se encuentra registrado.", 
                 status_code=400, 
                 code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                 level="WARNING"
             )
        
        payload = datos.model_dump(exclude_unset=True)
        
        if not ctx["is_superadmin"]:
            if not ctx["user_id"]:
                  raise AppError(
                      message=AppMessages.AUTH_SESSION_EXPIRED, 
                      status_code=400, 
                      code=ErrorCodes.AUTH_SESSION_EXPIRED,
                      description="Vendedor ID no encontrado en sesión"
                  )
            payload['vendedor_id'] = ctx["user_id"]
            
        try:
             nueva = self.repo.crear_empresa(payload)
             return nueva
        except Exception as e:
             if "vendedor_id" in str(e) and "viol" in str(e):
                  raise AppError(
                      message=AppMessages.VAL_INVALID_INPUT, 
                      status_code=400, 
                      code=ErrorCodes.VAL_INVALID_INPUT,
                      description="ID de Vendedor inválido"
                  )
             raise e

    def obtener_empresa(self, empresa_id: UUID, usuario_actual: dict):
        empresa = self.repo.obtener_por_id(empresa_id)
        if not empresa:
             raise AppError(
                 message=AppMessages.DB_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.DB_NOT_FOUND,
                 description="La empresa solicitada no existe."
             )
        
        ctx = self._get_context(usuario_actual)
        
        if ctx["is_superadmin"]:
            return empresa
        
        if ctx["is_vendedor"]:
            if str(empresa.get('vendedor_id')) != str(ctx["user_id"]):
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
        ctx = self._get_context(usuario_actual)
        self.repo.check_expired_subscriptions()
        
        if ctx["is_superadmin"]:
            return self.repo.listar_empresas(vendedor_id=vendedor_id)

        if ctx["is_vendedor"]:
             if vendedor_id and str(vendedor_id) != str(ctx["user_id"]):
                  raise AppError(
                      message=AppMessages.PERM_FORBIDDEN, 
                      status_code=403, 
                      code=ErrorCodes.PERM_FORBIDDEN,
                      description="No puedes ver empresas de otros vendedores"
                  )
             return self.repo.listar_empresas(vendedor_id=ctx["user_id"])

        if ctx["is_usuario"]:
            if not ctx["empresa_id"]: return []
            return self.repo.listar_empresas(empresa_id=ctx["empresa_id"])
            
        raise AppError(
            message=AppMessages.PERM_FORBIDDEN, 
            status_code=403, 
            code=ErrorCodes.PERM_FORBIDDEN
        )

    def list_empresas(self, usuario_actual: dict, vendedor_id: Optional[UUID] = None):
        # Alias
        return self.listar_empresas(usuario_actual, vendedor_id)

    def actualizar_empresa(self, empresa_id: UUID, datos: EmpresaActualizacion, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        current = self.obtener_empresa(empresa_id, usuario_actual)
        
        payload = datos.model_dump(exclude_unset=True)
        
        if 'ruc' in payload and payload['ruc'] != current['ruc']:
             if self.repo.obtener_por_ruc(payload['ruc']):
                 raise AppError(
                     message="El RUC ya está en uso por otra empresa.", 
                     status_code=400, 
                     code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                     level="WARNING"
                 )
                 
        if not ctx["is_superadmin"]:
            if 'activo' in payload and payload['activo'] != current['activo']:
                 raise AppError(
                     message=AppMessages.PERM_FORBIDDEN, 
                     status_code=403, 
                     code=ErrorCodes.PERM_FORBIDDEN,
                     description="Solo Superadmin puede cambiar estado activo"
                 )

        updated = self.repo.actualizar_empresa(empresa_id, payload)
        if not updated:
             raise AppError(
                 message=AppMessages.SYS_INTERNAL_ERROR, 
                 status_code=500, 
                 code=ErrorCodes.DB_QUERY_ERROR,
                 description="Error al actualizar empresa en base de datos"
             )
        return updated

    def eliminar_empresa(self, empresa_id: UUID, usuario_actual: dict):
        self.obtener_empresa(empresa_id, usuario_actual)
        ctx = self._get_context(usuario_actual)
        
        if ctx["is_usuario"]:
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
             
        if not self.repo.eliminar_empresa(empresa_id):
             raise AppError(
                 message=AppMessages.SYS_INTERNAL_ERROR, 
                 status_code=500, 
                 code=ErrorCodes.DB_QUERY_ERROR,
                 description="Error al eliminar empresa"
             )
        return True

    def toggle_active(self, empresa_id: UUID, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        if not ctx["is_superadmin"]:
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
             
        empresa = self.repo.obtener_por_id(empresa_id)
        if not empresa: 
             raise AppError(
                 message=AppMessages.DB_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.DB_NOT_FOUND
             )
        
        new_status = not empresa.get("activo", True)
        return self.repo.actualizar_empresa(empresa_id, {"activo": new_status})

    def assign_vendor(self, empresa_id: UUID, vendedor_id: UUID, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        if not ctx["is_superadmin"]:
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
             
        empresa = self.repo.obtener_por_id(empresa_id)
        if not empresa: 
             raise AppError(
                 message=AppMessages.DB_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.DB_NOT_FOUND
             )
        
        try:
             return self.repo.actualizar_empresa(empresa_id, {"vendedor_id": vendedor_id})
        except Exception:
             raise AppError(
                 message=AppMessages.VAL_INVALID_INPUT, 
                 status_code=400, 
                 code=ErrorCodes.DB_CONSTRAINT_VIOLATION,
                 description="Error al asignar vendedor (ID inválido o inexistente)"
             )

    def change_plan(self, empresa_id: UUID, plan_id: UUID, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        if not ctx["is_superadmin"]:
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_FORBIDDEN
             )
             
        empresa = self.repo.obtener_por_id(empresa_id)
        if not empresa: 
             raise AppError(
                 message=AppMessages.DB_NOT_FOUND, 
                 status_code=404, 
                 code=ErrorCodes.DB_NOT_FOUND
             )
        
        subscription_data = {
            "empresa_id": empresa_id,
            "plan_id": plan_id,
            "monto": 0,
            "fecha_pago": datetime.now(),
            "fecha_inicio_periodo": datetime.now(),
            "fecha_fin_periodo": datetime.now() + timedelta(days=30), 
            "metodo_pago": "MANUAL_SUPERADMIN",
            "estado": "PAGADO",
            "registrado_por": None,
            "observaciones": f"Cambio de plan manual por Superadmin (ID: {ctx['user_id']})"
        }
        
        if not self.repo.create_manual_subscription(subscription_data):
             raise AppError(
                 message=AppMessages.SYS_INTERNAL_ERROR, 
                 status_code=500, 
                 code=ErrorCodes.DB_QUERY_ERROR,
                 description="Error al registrar suscripción manual"
             )
             
        updates = {
            "estado_suscripcion": SubscriptionStatus.ACTIVA,
            "fecha_activacion": datetime.now() if not empresa.get('fecha_activacion') else empresa['fecha_activacion'],
            "fecha_vencimiento": subscription_data["fecha_fin_periodo"]
        }
        
        return self.repo.actualizar_empresa(empresa_id, updates)
