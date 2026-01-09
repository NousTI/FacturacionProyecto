from fastapi import Depends, HTTPException, status
from uuid import UUID
from datetime import date

from models.Suscripcion import PagoSuscripcionCreate
from repositories.suscripcion_repository import SuscripcionRepository
from repositories.plan_repository import PlanRepository
from utils.enums import PaymentStatus, RolCodigo, AuthKeys, SubscriptionStatus
from utils.payment_factory import PaymentFactory
from services.comision_service import ComisionService

from services.modulo_service import ModuloService

class SuscripcionService:
    def __init__(
        self, 
        suscripcion_repo: SuscripcionRepository = Depends(),
        plan_repo: PlanRepository = Depends(),
        comision_service: ComisionService = Depends(),
        modulo_service: ModuloService = Depends()
    ):
        self.suscripcion_repo = suscripcion_repo
        self.plan_repo = plan_repo
        self.comision_service = comision_service
        self.modulo_service = modulo_service

    def registrar_pago(self, pago: PagoSuscripcionCreate, current_user: dict):
        # ... validation ...
        # (Assuming surrounding code is same, replacing from method signature down to end of logic)
        
        user_empresa_id = current_user.get("empresa_id")
        user_id = current_user.get("id")
        rol_id = current_user.get("rol_id")
        
        # 0. Strict Check
        if current_user.get(AuthKeys.IS_VENDEDOR):
             raise HTTPException(status_code=403, detail="Vendedores no pueden registrar pagos")

        # 1. Validation
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN) or current_user.get("role") == "superadmin"
        if is_superadmin:
            if not pago.registrado_por:
                raise HTTPException(status_code=400, detail="Superadmin debe especificar 'registrado_por'")
        else:
            if pago.registrado_por:
                 raise HTTPException(status_code=403, detail="No puedes asignar 'registrado_por'")
            pago.registrado_por = user_id
            
        self._validate_registration_request(pago, user_empresa_id, rol_id, is_superadmin)

        # 2. Process Gateway
        gateway = PaymentFactory.get_gateway(pago.metodo_pago)
        payment_result = gateway.process_payment(pago.monto, "USD", pago.model_dump())
        if payment_result.get("status") != PaymentStatus.COMPLETED.value:
             raise HTTPException(status_code=400, detail=ErrorMessages.PAYMENT_PROCESS_ERROR)

        # 3. Comision
        comision_data = self.comision_service.calculate_potential_commission(pago.empresa_id, pago.monto)

        # 7. Status Logic
        from utils.enums import PaymentMethod
        try:
             method_enum = PaymentMethod(pago.metodo_pago.upper())
        except ValueError:
             raise HTTPException(status_code=400)

        is_manual = method_enum in [PaymentMethod.TRANSFERENCIA, PaymentMethod.EFECTIVO, PaymentMethod.CHEQUE, PaymentMethod.MANUAL]
        initial_pago_status = PaymentStatus.PENDING.value if is_manual else PaymentStatus.COMPLETED.value
        
        if is_manual:
             new_empresa_status = SubscriptionStatus.PENDIENTE.value
             comision_data = None # No commission yet
        else:
             new_empresa_status = SubscriptionStatus.ACTIVA.value
        
        # 4. Persistence
        pago_data = pago.model_dump()
        pago_data["estado"] = initial_pago_status
        
        result = self.suscripcion_repo.create_subscription_atomic(
            pago_data=pago_data,
            empresa_id=pago.empresa_id,
            new_empresa_status=new_empresa_status,
            fecha_activacion=pago.fecha_inicio_periodo,
            fecha_vencimiento=pago.fecha_fin_periodo,
            cancel_previous_status=SubscriptionStatus.CANCELADA.value,
            comision_data=comision_data
        )
        
        if result and not is_manual:
             # AUTO SYNC MODULES IF ACTIVATED
             try:
                 self.modulo_service.sync_empresa_modules(pago.empresa_id, pago.plan_id, pago.fecha_fin_periodo)
             except Exception as e:
                 print(f"Error syncing modules: {e}")
                 # Non-blocking? Or warning?
        
        return result

    def list_pagos(self, current_user: dict, estado: str = None, fecha_inicio: date = None, fecha_fin: date = None) -> list:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN) or current_user.get("role") == "superadmin"
        
        empresa_id = None
        if not is_superadmin:
            empresa_id = current_user.get("empresa_id")
            if not empresa_id:
                 return [] # Or raise error if user has no company
        
        pagos = self.suscripcion_repo.list_pagos(
            empresa_id=empresa_id, 
            estado=estado,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        return pagos

    def approve_pago(self, pago_id: UUID, current_user: dict):
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN) or current_user.get("role") == "superadmin"
        if not is_superadmin:
             raise HTTPException(status_code=403, detail="Solo superadmin")

        pago = self.suscripcion_repo.get_pago_by_id(pago_id)
        if not pago: raise HTTPException(status_code=404)
        
        if pago['estado'] == PaymentStatus.COMPLETED.value:
             return {"message": "Ya aprobado"}
        if pago['estado'] != PaymentStatus.PENDING.value:
             raise HTTPException(status_code=400, detail="Solo pagos PENDIENTE")

        monto = float(pago['monto'])
        comision_data = self.comision_service.calculate_potential_commission(pago['empresa_id'], monto)
        
        success = self.suscripcion_repo.approve_subscription(
            pago_id=pago_id, 
            empresa_id=pago['empresa_id'],
            fecha_activacion=pago['fecha_inicio_periodo'],
            fecha_vencimiento=pago['fecha_fin_periodo'],
            comision_data=comision_data
        )
        
        if success:
             # AUTO SYNC MODULES
             try:
                 self.modulo_service.sync_empresa_modules(
                     pago['empresa_id'], 
                     pago['plan_id'], 
                     pago['fecha_fin_periodo']
                 )
             except Exception as e:
                 print(f"Error syncing modules approval: {e}")

             return {"message": "Pago aprobado y módulos sincronizados"}
        
        raise HTTPException(status_code=500, detail="Error approving")

    def registrar_pago_rapido(self, data: 'PagoSuscripcionQuick', current_user: dict):
        """
        Registro simplificado para Superadmin:
        - Calcula monto desde el Plan.
        - Calcula fechas (extensión o inicio hoy).
        - Marcado como COMPLETED automáticamente.
        """
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN) or current_user.get("role") == "superadmin"
        if not is_superadmin:
             raise HTTPException(status_code=403, detail="Acción exclusiva de Superadmin")

        # 1. Obtener Plan
        plan = self.plan_repo.get_plan(data.plan_id)
        if not plan:
             raise HTTPException(status_code=404, detail="Plan no encontrado")
        
        # 2. Obtener Empresa para ver vencimiento actual
        from repositories.empresa_repository import EmpresaRepository
        empresa_repo = EmpresaRepository(self.suscripcion_repo.db)
        empresa = empresa_repo.get_empresa_by_id(data.empresa_id)
        if not empresa:
             raise HTTPException(status_code=404, detail="Empresa no encontrada")

        # 3. Calcular Periodo
        from datetime import datetime, timedelta, timezone
        ahora = datetime.now(timezone.utc)
        
        # Usar valores manuales si vienen en la petición, de lo contrario calcular
        monto_final = data.monto if data.monto is not None else plan['precio_mensual']
        
        if data.fecha_inicio_periodo:
            fecha_inicio = data.fecha_inicio_periodo
        else:
            fecha_vencimiento_actual = empresa.get('fecha_vencimiento')
            if fecha_vencimiento_actual and fecha_vencimiento_actual > ahora:
                 fecha_inicio = fecha_vencimiento_actual
            else:
                 fecha_inicio = ahora
        
        if data.fecha_fin_periodo:
            fecha_fin = data.fecha_fin_periodo
        else:
            fecha_fin = fecha_inicio + timedelta(days=30)

        # 4. Preparar Datos del Pago
        pago_dict = {
            "empresa_id": data.empresa_id,
            "plan_id": data.plan_id,
            "monto": monto_final,
            "fecha_pago": ahora,
            "fecha_inicio_periodo": fecha_inicio,
            "fecha_fin_periodo": fecha_fin,
            "metodo_pago": data.metodo_pago,
            "estado": PaymentStatus.COMPLETED.value,
            "numero_comprobante": data.numero_comprobante,
            "observaciones": data.observaciones or f"Pago registrado por Superadmin (ID: {current_user.get('id')})",
            "registrado_por": current_user.get('id') if not is_superadmin else None
        }

        # 5. Comision
        comision_data = self.comision_service.calculate_potential_commission(data.empresa_id, monto_final)

        # 6. Guardar Atómicamente
        result = self.suscripcion_repo.create_subscription_atomic(
            pago_data=pago_dict,
            empresa_id=data.empresa_id,
            new_empresa_status=SubscriptionStatus.ACTIVA.value,
            fecha_activacion=fecha_inicio,
            fecha_vencimiento=fecha_fin,
            cancel_previous_status=SubscriptionStatus.CANCELADA.value,
            comision_data=comision_data
        )

        if result:
            # Sincronizar Módulos
            try:
                self.modulo_service.sync_empresa_modules(data.empresa_id, data.plan_id, fecha_fin)
            except Exception as e:
                print(f"Error syncing modules in Quick Pay: {e}")

        return result

    def reject_pago(self, pago_id: UUID, observaciones: str, current_user: dict):
        """
        Rechaza un pago pendiente.
        """
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN) or current_user.get("role") == "superadmin"
        if not is_superadmin:
             raise HTTPException(status_code=403, detail="Solo superadmin")

        pago = self.suscripcion_repo.get_pago_by_id(pago_id)
        if not pago: raise HTTPException(status_code=404)
        
        if pago['estado'] != PaymentStatus.PENDING.value:
             raise HTTPException(status_code=400, detail="Solo se pueden rechazar pagos PENDIENTES")

        success = self.suscripcion_repo.update_pago_status(
            pago_id=pago_id,
            nuevo_estado=PaymentStatus.REJECTED.value,
            observaciones=observaciones or f"Pago rechazado por Superadmin (ID: {current_user.get('id')})"
        )
        
        return {"message": "Pago rechazado correctamente"} if success else {"error": "No se pudo actualizar"}

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
