from fastapi import Depends
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional

from .repository import RepositorioEmpresa
from .schemas import EmpresaCreacion, EmpresaActualizacion
from ...constants.enums import AuthKeys, SubscriptionStatus
from ...errors.app_error import AppError

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
             raise AppError("No autorizado para crear empresas", 403, "AUTH_FORBIDDEN")

        if self.repo.obtener_por_ruc(datos.ruc):
             raise AppError("El RUC ya está registrado", 400, "EMPRESA_RUC_EXISTS")
        
        payload = datos.model_dump(exclude_unset=True)
        
        if not ctx["is_superadmin"]:
            if not ctx["user_id"]:
                  raise AppError("Vendedor ID no encontrado en sesión", 400, "AUTH_ERROR")
            payload['vendedor_id'] = ctx["user_id"]
            
        try:
             nueva = self.repo.crear_empresa(payload)
             return nueva
        except Exception as e:
             if "vendedor_id" in str(e) and "viol" in str(e):
                  raise AppError("ID de Vendedor inválido", 400, "INVALID_VENDEDOR_ID")
             raise e

    def obtener_empresa(self, empresa_id: UUID, usuario_actual: dict):
        empresa = self.repo.obtener_por_id(empresa_id)
        if not empresa:
             raise AppError("Empresa no encontrada", 404, "EMPRESA_NOT_FOUND")
        
        ctx = self._get_context(usuario_actual)
        
        if ctx["is_superadmin"]:
            return empresa
        
        if ctx["is_vendedor"]:
            if str(empresa.get('vendedor_id')) != str(ctx["user_id"]):
                 raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            return empresa

        if ctx["is_usuario"]:
             if str(empresa_id) != str(ctx["empresa_id"]):
                  raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
             return empresa
             
        raise AppError("Rol no autorizado", 403, "AUTH_FORBIDDEN")
        
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
                  raise AppError("No puedes ver empresas de otros vendedores", 403, "AUTH_FORBIDDEN")
             return self.repo.listar_empresas(vendedor_id=ctx["user_id"])

        if ctx["is_usuario"]:
            if not ctx["empresa_id"]: return []
            return self.repo.listar_empresas(empresa_id=ctx["empresa_id"])
            
        raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")

    def list_empresas(self, usuario_actual: dict, vendedor_id: Optional[UUID] = None):
        # Alias
        return self.listar_empresas(usuario_actual, vendedor_id)

    def actualizar_empresa(self, empresa_id: UUID, datos: EmpresaActualizacion, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        current = self.obtener_empresa(empresa_id, usuario_actual)
        
        payload = datos.model_dump(exclude_unset=True)
        
        if 'ruc' in payload and payload['ruc'] != current['ruc']:
             if self.repo.obtener_por_ruc(payload['ruc']):
                 raise AppError("El RUC ya está en uso", 400, "EMPRESA_RUC_EXISTS")
                 
        if not ctx["is_superadmin"]:
            if 'activo' in payload and payload['activo'] != current['activo']:
                 raise AppError("Solo Superadmin puede cambiar estado activo", 403, "AUTH_FORBIDDEN")

        updated = self.repo.actualizar_empresa(empresa_id, payload)
        if not updated:
             raise AppError("Error al actualizar empresa", 500, "DB_ERROR")
        return updated

    def eliminar_empresa(self, empresa_id: UUID, usuario_actual: dict):
        self.obtener_empresa(empresa_id, usuario_actual)
        ctx = self._get_context(usuario_actual)
        
        if ctx["is_usuario"]:
             raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
             
        if not self.repo.eliminar_empresa(empresa_id):
             raise AppError("Error al eliminar empresa", 500, "DB_ERROR")
        return True

    def toggle_active(self, empresa_id: UUID, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        if not ctx["is_superadmin"]:
             raise AppError("Solo Superadmin", 403, "AUTH_FORBIDDEN")
             
        empresa = self.repo.obtener_por_id(empresa_id)
        if not empresa: raise AppError("Empresa no encontrada", 404, "EMPRESA_NOT_FOUND")
        
        new_status = not empresa.get("activo", True)
        return self.repo.actualizar_empresa(empresa_id, {"activo": new_status})

    def assign_vendor(self, empresa_id: UUID, vendedor_id: UUID, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        if not ctx["is_superadmin"]:
             raise AppError("Solo Superadmin", 403, "AUTH_FORBIDDEN")
             
        empresa = self.repo.obtener_por_id(empresa_id)
        if not empresa: raise AppError("Empresa no encontrada", 404, "EMPRESA_NOT_FOUND")
        
        try:
             return self.repo.actualizar_empresa(empresa_id, {"vendedor_id": vendedor_id})
        except Exception:
             raise AppError("Error al asignar vendedor (ID inválido?)", 400, "DB_ERROR")

    def change_plan(self, empresa_id: UUID, plan_id: UUID, usuario_actual: dict):
        ctx = self._get_context(usuario_actual)
        if not ctx["is_superadmin"]:
             raise AppError("Solo Superadmin", 403, "AUTH_FORBIDDEN")
             
        empresa = self.repo.obtener_por_id(empresa_id)
        if not empresa: raise AppError("Empresa no encontrada", 404, "EMPRESA_NOT_FOUND")
        
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
             raise AppError("Error al registrar suscripción", 500, "DB_ERROR")
             
        updates = {
            "estado_suscripcion": SubscriptionStatus.ACTIVA,
            "fecha_activacion": datetime.now() if not empresa.get('fecha_activacion') else empresa['fecha_activacion'],
            "fecha_vencimiento": subscription_data["fecha_fin_periodo"]
        }
        
        return self.repo.actualizar_empresa(empresa_id, updates)
