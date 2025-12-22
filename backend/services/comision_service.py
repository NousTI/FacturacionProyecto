from fastapi import Depends, HTTPException, status
from uuid import UUID
from typing import List, Optional

from repositories.comision_repository import ComisionRepository
from utils.enums import AuthKeys
from models.Comision import ComisionUpdate, ComisionCreate

from repositories.empresa_repository import EmpresaRepository
from repositories.vendedor_repository import VendedorRepository
from datetime import date
from utils.enums import CommissionStatus

class ComisionService:
    def __init__(
        self, 
        repo: ComisionRepository = Depends(),
        empresa_repo: EmpresaRepository = Depends(),
        vendedor_repo: VendedorRepository = Depends()
    ):
        self.repo = repo
        self.empresa_repo = empresa_repo
        self.vendedor_repo = vendedor_repo

    def calculate_potential_commission(self, empresa_id: UUID, monto_pago: float) -> Optional[dict]:
        empresa = self.empresa_repo.get_empresa_by_id(empresa_id)
        if not empresa or not empresa.get('vendedor_id'):
            return None
            
        vendedor = self.vendedor_repo.get_by_id(empresa['vendedor_id'])
        if not vendedor: 
            return None
            
        porcentaje = float(vendedor.get('porcentaje_comision', 0) or 0)
        if porcentaje <= 0:
            return None
            
        monto_comision = float(monto_pago) * (porcentaje / 100.0)
        
        return {
            "vendedor_id": str(vendedor['id']),
            "monto": round(monto_comision, 2),
            "porcentaje_aplicado": porcentaje,
            "estado": CommissionStatus.PENDIENTE.value,
            "fecha_generacion": date.today()
        }

    def create_manual(self, datos: ComisionCreate, current_user: dict):
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            raise HTTPException(status_code=403, detail="Solo administradores pueden crear comisiones manualmente")
        
        # We could add validations here (e.g. check if pago_suscripcion_id exists, or if vendor exists)
        # For now, let DB constraints handle FK integrity to avoid extra queries, or add simple checks if requested.
        # But user asked for "json to work". The structure matches.
        
        return self.repo.create(datos.model_dump())

    def list_comisiones(self, current_user: dict):
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
        user_id = current_user.get("id")

        if is_superadmin:
            # List all
            return self.repo.list_comisiones(vendedor_id=None)
        elif is_vendedor:
            # List own
            return self.repo.list_comisiones(vendedor_id=user_id)
        else:
            # Regular users cannot see commissions
            raise HTTPException(status_code=403, detail="No autorizado para ver comisiones")

    def get_comision(self, comision_id: UUID, current_user: dict):
        comision = self.repo.get_by_id(comision_id)
        if not comision:
            raise HTTPException(status_code=404, detail="Comisión no encontrada")

        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
        user_id = current_user.get("id")

        if is_superadmin:
            return comision
        elif is_vendedor:
            # Verify ownership
            if str(comision['vendedor_id']) != str(user_id):
                raise HTTPException(status_code=403, detail="No tienes acceso a esta comisión")
            return comision
        else:
            raise HTTPException(status_code=403, detail="No autorizado")

    def update(self, comision_id: UUID, update_data: ComisionUpdate, current_user: dict):
        # Admin only
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            raise HTTPException(status_code=403, detail="Solo administradores pueden modificar comisiones")
        
        # Check existence
        existing = self.repo.get_by_id(comision_id)
        if not existing:
             raise HTTPException(status_code=404, detail="Comisión no encontrada")

        # Use model_dump for Pydantic V2
        data = update_data.model_dump(exclude_unset=True)
        return self.repo.update(comision_id, data)

    def delete(self, comision_id: UUID, current_user: dict):
        # Admin only
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar comisiones")

        if not self.repo.delete(comision_id):
             raise HTTPException(status_code=404, detail="Comisión no encontrada o no se pudo eliminar")
        return True
