from fastapi import Depends, HTTPException, status
from uuid import UUID
from datetime import date

from models.Suscripcion import PagoSuscripcionCreate
from repositories.suscripcion_repository import SuscripcionRepository
from repositories.plan_repository import PlanRepository
from utils.enums import PaymentStatus, RolCodigo, AuthKeys
from utils.payment_factory import PaymentFactory
from services.comision_service import ComisionService

from utils.messages import ErrorMessages

class SuscripcionService:
    def __init__(
        self, 
        suscripcion_repo: SuscripcionRepository = Depends(),
        plan_repo: PlanRepository = Depends(),
        comision_service: ComisionService = Depends()
    ):
        self.suscripcion_repo = suscripcion_repo
        self.plan_repo = plan_repo
        self.comision_service = comision_service

    def registrar_pago(self, pago: PagoSuscripcionCreate, current_user: dict):
        user_empresa_id = current_user.get("empresa_id")
        user_id = current_user.get("id")
        rol_id = current_user.get("rol_id")

        # 0. Strict Check: Vendedores cannot register payments
        if current_user.get(AuthKeys.IS_VENDEDOR):
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Los vendedores no tienen permiso para registrar pagos manualmente"
            )

        # 1. Validation
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        # Fallback check
        if current_user.get("role") == "superadmin":
            is_superadmin = True

        self._validate_registration_request(pago, user_empresa_id, rol_id, is_superadmin)
        
        # 2. Process Payment via Gateway (Interface)
        # This is where we would call Stripe/PayPal API
        gateway = PaymentFactory.get_gateway(pago.metodo_pago)
        payment_result = gateway.process_payment(pago.monto, "USD", pago.model_dump())
        
        if payment_result.get("status") != PaymentStatus.COMPLETED.value:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorMessages.PAYMENT_PROCESS_ERROR
            )

        # 3. Calculate Commission (Delegated)
        comision_data = self.comision_service.calculate_potential_commission(pago.empresa_id, pago.monto)

        # 4. Persistence (DB Transaction)
        pago_data = pago.model_dump()
        result = self.suscripcion_repo.registrar_suscripcion(
            pago_data=pago_data,
            empresa_id=pago.empresa_id,
            plan_id=pago.plan_id,
            fecha_activacion=pago.fecha_inicio_periodo,
            fecha_vencimiento=pago.fecha_fin_periodo,
            comision_data=comision_data
        )
        
        if not result:
            raise HTTPException(status_code=500, detail=ErrorMessages.PAYMENT_DB_ERROR)
            
        return result

    def _validate_registration_request(self, pago, user_empresa_id, rol_id, is_superadmin=False):
        if is_superadmin:
            # Superadmin bypasses company and role checks
            # Only validate data integrity
            pass
        else:
            # 1. Verify Membership
            if str(pago.empresa_id) != str(user_empresa_id):
                 raise HTTPException(status_code=403, detail=ErrorMessages.PAYMENT_COMPANY_MISMATCH)

            # 2. Verify Role
            rol_codigo = self.suscripcion_repo.get_rol_codigo(rol_id)
            if rol_codigo not in [RolCodigo.ADMIN.value]:
                 raise HTTPException(status_code=403, detail=ErrorMessages.PAYMENT_ADMIN_REQUIRED)

        # 3. Validate Plan
        plan = self.plan_repo.get_plan(pago.plan_id)
        if not plan:
             raise HTTPException(status_code=404, detail=ErrorMessages.PLAN_NOT_FOUND)
        if not plan['activo']:
             raise HTTPException(status_code=400, detail=ErrorMessages.PLAN_NOT_ACTIVE)

        # 4. Dates
        if pago.fecha_inicio_periodo >= pago.fecha_fin_periodo:
             raise HTTPException(status_code=400, detail=ErrorMessages.INVALID_DATE_RANGE)

    def list_pagos(self, current_user: dict, estado: str = None):
        # Superadmin sees all (pass None).
        # Enterprise User sees own (pass empresa_id).
        # We need to detect role.
        # "is_superadmin" key usually set by middleware/auth.
        
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        # Fallback check
        if current_user.get("role") == "superadmin":
            is_superadmin = True
            
        if is_superadmin:
            return self.suscripcion_repo.list_pagos(None, estado=estado)
        
        # If not superadmin, restrict to empresa_id AND Admin/Owner role
        empresa_id = current_user.get("empresa_id")
        if not empresa_id:
             return []

        rol_id = current_user.get("rol_id")
        rol_codigo = self.suscripcion_repo.get_rol_codigo(rol_id)
        if rol_codigo not in [RolCodigo.ADMIN.value]:
             # Raise 403 or return empty list? Usually 403 for clear restriction.
             # User asked "only admin u owner can see".
             raise HTTPException(status_code=403, detail=ErrorMessages.PAYMENT_VIEW_ADMIN_REQUIRED)
             
        return self.suscripcion_repo.list_pagos(empresa_id, estado=estado)

    def get_pago(self, pago_id: UUID, current_user: dict):
        pago = self.suscripcion_repo.get_pago_by_id(pago_id)
        if not pago:
            raise HTTPException(status_code=404, detail=ErrorMessages.PAYMENT_NOT_FOUND)
            
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        if current_user.get("role") == "superadmin":
            is_superadmin = True
            
        if is_superadmin:
            return pago
            
        # Verify ownership
        empresa_id = current_user.get("empresa_id")
        if str(pago['empresa_id']) != str(empresa_id):
             raise HTTPException(status_code=403, detail=ErrorMessages.PAYMENT_ACCESS_DENIED)

        # Verify Role (Admin/Owner)
        rol_id = current_user.get("rol_id")
        rol_codigo = self.suscripcion_repo.get_rol_codigo(rol_id)
        if rol_codigo not in [RolCodigo.ADMIN.value]:
             raise HTTPException(status_code=403, detail=ErrorMessages.PAYMENT_DETAIL_ADMIN_REQUIRED)
              
        return pago
