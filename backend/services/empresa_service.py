from fastapi import Depends, HTTPException, status
from repositories.empresa_repository import EmpresaRepository
from models.Empresa import EmpresaCreate, EmpresaUpdate
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional
from utils.enums import AuthKeys, SubscriptionStatus

class EmpresaService:
    def __init__(self, repository: EmpresaRepository = Depends()):
        self.repository = repository

    def _get_user_context(self, current_user: dict):
        return {
            "is_superadmin": current_user.get(AuthKeys.IS_SUPERADMIN, False),
            "is_vendedor": current_user.get(AuthKeys.IS_VENDEDOR, False),
            "is_usuario": current_user.get(AuthKeys.IS_USUARIO, False),
            "user_id": current_user.get("id"),
            "empresa_id": current_user.get("empresa_id")
        }

    def create_empresa(self, empresa: EmpresaCreate, current_user: dict):
        ctx = self._get_user_context(current_user)

        # Permission Check: Only Superadmin or Vendedor can create/manage companies
        if not ctx["is_superadmin"] and not ctx["is_vendedor"]:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción"
            )

        # Validate RUC uniqueness
        if self.repository.get_empresa_by_ruc(empresa.ruc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El RUC ya está registrado para otra empresa"
            )
        
        data = empresa.model_dump(exclude_unset=True)
        
        # If caller is not superadmin, force assignment to themselves
        if not ctx["is_superadmin"]:
            if not ctx["user_id"]:
                  raise HTTPException(status_code=400, detail="Vendedor ID requerido")
            data['vendedor_id'] = ctx["user_id"]
        # Else (Superadmin): allow whatever is in data['vendedor_id'] or implicitly None
            
        try:
             new_empresa = self.repository.create_empresa(data)
        except Exception as e:
             error_str = str(e)
             if "vendedor_id" in error_str and "viol" in error_str:
                  raise HTTPException(status_code=400, detail="El Vendedor ID especificado no existe")
             raise HTTPException(status_code=500, detail=f"Error al crear la empresa: {error_str}")
             
        if not new_empresa:
             raise HTTPException(status_code=500, detail="Error al crear la empresa")
        return new_empresa

    def get_empresa(self, empresa_id: UUID, current_user: dict) -> dict:
        empresa = self.repository.get_empresa_by_id(empresa_id)
        if not empresa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada"
            )
        
        ctx = self._get_user_context(current_user)

        # Permission Check
        if ctx["is_superadmin"]:
            return empresa
        
        if ctx["is_vendedor"]:
            if str(empresa.get('vendedor_id')) != str(ctx["user_id"]):
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para ver esta empresa")
            return empresa

        if ctx["is_usuario"]:
             # User can only see their own empresa
             if str(empresa_id) != str(ctx["empresa_id"]):
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para ver esta empresa")
             return empresa

        # Fallback
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Rol no autorizado")

    def list_empresas(self, current_user: dict, vendedor_id: Optional[UUID] = None) -> List[dict]:
        ctx = self._get_user_context(current_user)
        
        # Automáticamente sincronizar/vencer suscripciones antes de listar
        # Esto asegura que el Superadmin vea los estados reales al momento de consultar.
        self.repository.check_expired_subscriptions()
        
        # 1. Superadmin: Can see all or filter by passed vendedor_id
        if ctx["is_superadmin"]:
            return self.repository.list_empresas(vendedor_id=vendedor_id)

        # 2. Vendedor: Only see their assigned companies
        if ctx["is_vendedor"]:
             # If they tried to filter by another vendor, deny or ignore. Let's ignore/override.
             if vendedor_id and str(vendedor_id) != str(ctx["user_id"]):
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes ver empresas de otros vendedores")
             return self.repository.list_empresas(vendedor_id=ctx["user_id"])

        # 3. Usuario: Only see their own specific company (as a list of one)
        if ctx["is_usuario"]:
            if not ctx["empresa_id"]:
                 return []
            return self.repository.list_empresas(empresa_id=ctx["empresa_id"])
            
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para listar empresas")

    def update_empresa(self, empresa_id: UUID, empresa_update: EmpresaUpdate, current_user: dict):
        ctx = self._get_user_context(current_user)

        # Check permissions first by fetching (this reuses the get_empresa logic)
        current = self.get_empresa(empresa_id, current_user)
        
        # RUC check if changing
        if empresa_update.ruc and empresa_update.ruc != current['ruc']:
             if self.repository.get_empresa_by_ruc(empresa_update.ruc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El RUC ya está en uso"
                )
        
        # STRICT Check: Vendedores cannot change 'activo' status
        if not ctx["is_superadmin"]:
            # Check if active status is being modified
            # Note: Pydantic model dump with exclude_unset=True might not have 'activo' key.
            # We access the update object directly or the dumped dict.
            if empresa_update.activo is not None and empresa_update.activo != current['activo']:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Solo el Superadmin puede cambiar el estado activo de una empresa"
                )

        try:
            updated = self.repository.update_empresa(empresa_id, empresa_update.model_dump(exclude_unset=True))
        except Exception as e:
            error_str = str(e)
            if "vendedor_id" in error_str and "viol" in error_str:
                  raise HTTPException(status_code=400, detail="El Vendedor ID especificado no existe")
            raise HTTPException(status_code=500, detail=f"Error al actualizar empresa: {error_str}")

        if not updated:
             raise HTTPException(status_code=500, detail="Error al actualizar empresa")
        return updated

    def delete_empresa(self, empresa_id: UUID, current_user: dict):
        # Use get_empresa to verify existence and permissions implicitly
        self.get_empresa(empresa_id, current_user)
        
        ctx = self._get_user_context(current_user)
        # Additional check: Maybe Users cannot delete, even if they can 'get'.
        # Assuming only Admin/Vendedor can delete. User (if they had access) shouldn't.
        if ctx["is_usuario"]:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para eliminar empresas")

        # Proceed to delete
        success = self.repository.delete_empresa(empresa_id)
        if not success:
            raise HTTPException(status_code=500, detail="Error al eliminar la empresa")
        return success

    def toggle_active(self, empresa_id: UUID, current_user: dict):
        ctx = self._get_user_context(current_user)

        # STRICT Check: Only Superadmin
        if not ctx["is_superadmin"]:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acción permitida solo para Superadmin"
            )

        # Get current state directly from repository avoiding the standard get logic overhead/filters if we want raw access
        # But standard get is fine since Superadmin can see all.
        empresa = self.repository.get_empresa_by_id(empresa_id)
        if not empresa:
             raise HTTPException(status_code=404, detail="Empresa no encontrada")

        new_status = not empresa.get("activo", True) # Flip existing status
        
        # Update
        updated = self.repository.update_empresa(empresa_id, {"activo": new_status})
        if not updated:
             raise HTTPException(status_code=500, detail="Error al cambiar el estado de la empresa")
             
        return updated

    def assign_vendor(self, empresa_id: UUID, vendedor_id: UUID, current_user: dict):
        ctx = self._get_user_context(current_user)

        # STRICT Check: Only Superadmin
        if not ctx["is_superadmin"]:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acción permitida solo para Superadmin"
            )
        
        # Verify Empresa exists
        empresa = self.repository.get_empresa_by_id(empresa_id)
        if not empresa:
             raise HTTPException(status_code=404, detail="Empresa no encontrada")

        # Update
        try:
            updated = self.repository.update_empresa(empresa_id, {"vendedor_id": vendedor_id})
        except Exception as e:
            error_str = str(e)
            if "viol" in error_str and "key" in error_str:
                 # Likely Vendedor ID FK violation
                 raise HTTPException(status_code=400, detail="El Vendedor ID proporcionado no es válido")
            raise HTTPException(status_code=500, detail=f"Error al asignar vendedor: {error_str}")

        if not updated:
             raise HTTPException(status_code=500, detail="Error al asignar vendedor")
             
        return updated
    
    def change_plan(self, empresa_id: UUID, plan_id: UUID, current_user: dict):
        ctx = self._get_user_context(current_user)
        
        # 1. Permission Check
        if not ctx["is_superadmin"]:
              raise HTTPException(status_code=403, detail="Solo Superadmin puede cambiar planes manualmente")

        # 2. Verify Data
        empresa = self.repository.get_empresa_by_id(empresa_id)
        if not empresa:
              raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        # 3. Create PagoSuscripcion Record
        # We need a repository for PagoSuscripcion interaction. 
        # Since we are in EmpresaService, we ideally should use PagoSuscripcionService or Repository directly.
        # But for valid architectural brevity, we might need to add a method to EmpresaRepository to create pago?
        # OR better, import PagoSuscripcionRepository if available.
        
        # Let's check imports first. If not available, we might add a raw method to EmpresaRepository 
        # for 'create_plan_subscription_manual' to avoid circular deps or complex service injection.
        
        subscription_data = {
            "empresa_id": empresa_id,
            "plan_id": plan_id,
            "monto": 0,
            "fecha_pago": datetime.now(),
            "fecha_inicio_periodo": datetime.now(),
            "fecha_fin_periodo": datetime.now() + timedelta(days=30), # Default 30 days
            "metodo_pago": "MANUAL_SUPERADMIN",
            "estado": "PAGADO",
            "registrado_por": None, # Superadmin is not in 'usuario' table
            "observaciones": f"Cambio de plan manual realizado por Superadmin (ID: {ctx['user_id']})"
        }
        
        # 4. Delegate to repository to insert into pago_suscripcion
        success = self.repository.create_manual_subscription(subscription_data)
        if not success:
             raise HTTPException(status_code=500, detail="Error al registrar el cambio de plan")
        
        # 5. Synchronize Empresa Status and Dates
        empresa_update = {
            "estado_suscripcion": SubscriptionStatus.ACTIVA,
            "fecha_activacion": datetime.now() if not empresa.get('fecha_activacion') else empresa['fecha_activacion'],
            "fecha_vencimiento": subscription_data["fecha_fin_periodo"]
        }
        self.repository.update_empresa(empresa_id, empresa_update)

        return success
