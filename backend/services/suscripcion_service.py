from fastapi import Depends, HTTPException, status
from uuid import UUID
from datetime import date

from models.Suscripcion import PagoSuscripcionCreate
from repositories.suscripcion_repository import SuscripcionRepository
from repositories.plan_repository import PlanRepository
from utils.enums import PaymentStatus, RolCodigo, AuthKeys, SubscriptionStatus
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

        # logic for registrado_por
        if is_superadmin:
            if not pago.registrado_por:
                raise HTTPException(status_code=400, detail="Superadmins deben especificar 'registrado_por' (ID de usuario)")
        else:
            if pago.registrado_por:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="No tienes permisos para asignar manualmente est campo 'registrado_por'. Se asigna automáticamente."
                )
            # Auto-assign
            pago.registrado_por = user_id

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
        # pago_data["registrado_por"] is already in model_dump
        
        # Business Logic: Determine statuses
        # When registering a new payment/subscription, we activate the company
        # and cancel any previously active "pago_suscripcion" to ensure only one is active.
        result = self.suscripcion_repo.create_subscription_atomic(
            pago_data=pago_data,
            empresa_id=pago.empresa_id,
            new_empresa_status=SubscriptionStatus.ACTIVA.value,
            fecha_activacion=pago.fecha_inicio_periodo,
            fecha_vencimiento=pago.fecha_fin_periodo,
            cancel_previous_status=SubscriptionStatus.CANCELADA.value,
            target_previous_status=SubscriptionStatus.ACTIVA.value,
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

        if pago.monto < 0:
             raise HTTPException(status_code=400, detail="El monto del pago no puede ser negativo")

        # 4. Dates
        if pago.fecha_inicio_periodo >= pago.fecha_fin_periodo:
             raise HTTPException(status_code=400, detail=ErrorMessages.INVALID_DATE_RANGE)

        # 5. Method Validation
        from utils.enums import PaymentMethod
        try:
            method_enum = PaymentMethod(pago.metodo_pago.upper())
        except ValueError:
             raise HTTPException(status_code=400, detail=f"Método de pago inválido. Permitidos: {[m.value for m in PaymentMethod]}")

        # 6. Idempotency Check (Financial Hardening)
        if pago.numero_comprobante:
             if self.suscripcion_repo.exists_payment_with_comprobante(pago.numero_comprobante, pago.empresa_id):
                  raise HTTPException(status_code=409, detail="Ya existe un pago registrado con este número de comprobante para esta empresa.")

        # 7. Payment Flow (Financial Hardening)
        # If Manual -> PENDING, No Activation.
        # If Automatic -> PAGADO, Activate.
        
        is_manual = method_enum in [PaymentMethod.TRANSFERENCIA, PaymentMethod.EFECTIVO, PaymentMethod.CHEQUE, PaymentMethod.MANUAL]
        
        initial_pago_status = PaymentStatus.PENDING.value if is_manual else PaymentStatus.COMPLETED.value
        
        # If manual, we DO NOT activate the company yet. We keep current status or set to PENDING?
        # Ideally, we leave it as is (probably PENDIENTE or SUSPENDIDA) until approved.
        # If automatic, we set to ACTIVA.
        
        if is_manual:
             new_empresa_status = SubscriptionStatus.PENDIENTE.value # Or keep previous? Safe to set PENDIENTE.
             # We should NOT update dates yet? Or update them but knowing it's not active?
             # Better: Do NOT update dates or status if pending.
             # But 'create_subscription_atomic' updates DB. We need to tell it WHAT to update.
             # Let's assume for PENDING payment, we assume Suscription is PENDING.
             pass
        else:
             new_empresa_status = SubscriptionStatus.ACTIVA.value

        # 3. Calculate Commission (Delegated)
        # Logic: Should we generate commission for PENDING payments?
        # Usually NO. Commission is earned when payment is CONFIRMED.
        # So if manual, comision_data should be None?
        # Yes, safe approach: Create Commission only when approved.
        
        comision_data = None
        if not is_manual:
            comision_data = self.comision_service.calculate_potential_commission(pago.empresa_id, pago.monto)

        # 4. Persistence (DB Transaction)
        pago_data = pago.model_dump()
        # pago_data["registrado_por"] is already in model_dump
        
        pago_data["estado"] = initial_pago_status
        
        # Business Logic: Determine statuses
        result = self.suscripcion_repo.create_subscription_atomic(
            pago_data=pago_data,
            empresa_id=pago.empresa_id,
            new_empresa_status=new_empresa_status, # PENDIENTE vs ACTIVA
            fecha_activacion=pago.fecha_inicio_periodo,
            fecha_vencimiento=pago.fecha_fin_periodo,
            cancel_previous_status=SubscriptionStatus.CANCELADA.value) if not is_manual else None, # Do not cancel old one if this is just a request
        return result

    def list_pagos(self, current_user: dict, estado: str = None):
        # Superadmin sees all (pass None).
        # Enterprise User sees own (pass empresa_id).
        
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
             raise HTTPException(status_code=403, detail=ErrorMessages.PAYMENT_VIEW_ADMIN_REQUIRED)
             
        return self.suscripcion_repo.list_pagos(empresa_id, estado=estado)

    def approve_pago(self, pago_id: UUID, current_user: dict):
        # 1. Access Control: Only Superadmin
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        if current_user.get("role") == "superadmin": is_superadmin = True
        
        if not is_superadmin:
             raise HTTPException(status_code=403, detail="Solo superadministradores pueden aprobar pagos")

        # 2. Retrieve Payment
        pago = self.suscripcion_repo.get_pago_by_id(pago_id)
        if not pago:
             raise HTTPException(status_code=404, detail="Pago no encontrado")
             
        if pago['estado'] == PaymentStatus.COMPLETED.value:
             return {"message": "El pago ya está aprobado"}
             
        if pago['estado'] != PaymentStatus.PENDING.value:
             raise HTTPException(status_code=400, detail="Solo se pueden aprobar pagos en estado PENDIENTE")

        # 3. Validation
        # Ensure we have start/end dates. They should be in the payment record ideally.
        # But 'pago' dict from DB has them.
        
        # 4. Calculate Commission
        # Now we definitely calculate commission
        monto = float(pago['monto']) # Convert Decimal to float for calc if needed, or keep Decimal if service handles it. Service uses float or decimal? 
        # ComisionService uses float usually but let's check. 
        # Our ComisionBase uses Decimal now. But 'calculate_potential_commission' returns dict with 'monto' as float/rounded.
        
        comision_data = self.comision_service.calculate_potential_commission(pago['empresa_id'], monto)
        
        # 5. Execute Approval
        success = self.suscripcion_repo.approve_subscription(
            pago_id=pago_id, 
            empresa_id=pago['empresa_id'],
            fecha_activacion=pago['fecha_inicio_periodo'],
            fecha_vencimiento=pago['fecha_fin_periodo'],
            comision_data=comision_data
        )
        
        if not success:
             raise HTTPException(status_code=500, detail="Error al aprobar el pago")
             
        return {"message": "Pago aprobado y suscripción activada correctamente"}

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
