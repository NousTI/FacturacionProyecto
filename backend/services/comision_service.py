from fastapi import Depends, HTTPException, status
from uuid import UUID
from typing import List, Optional

from repositories.comision_repository import ComisionRepository
from utils.enums import AuthKeys
from models.Comision import ComisionUpdate

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


    def list_comisiones(self, current_user: dict):
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        # Note: 'is_superadmin' in existing code usually means global admin. 
        # But request says "ADMIN / OWNER" which are role codes within an enterprise, 
        # OR "Admin" meaning the detailed Role code?
        # Re-reading request: "🧠 MODELO DE ROLES (BASE) ... OWNER / ADMIN ... VENDEDOR"
        # Since Vendedores are global entities (managed by Superadmin), but assigned to Empresas?
        # Actually in this system, Vendedor is a distinct entity from Usuario.
        # Usuario belongs to Empresa and has rol (ADMIN/OWNER/USER).
        # Vendedor is its own table.
        # So "VENDEDOR" refers to the entity logged in via `vendedor_id` (or `is_vendedor` flag).
        # "ADMIN / OWNER" likely refers to Superadmin OR Enterprise Admin?
        # Request says: "El admin puede: listar todas... El vendedor solo puede: listar sus comisiones...".
        # This usually implies Superadmin vs Vendedor.
        # BUT wait, commissions are for Vendedores. Who pays them? The Platform Owner (Superadmin)? Or the Enterprise?
        # "SaaS": usually Platform Owner pays Commission to Vendedor who brought the credentials.
        # So "ADMIN" likely means Superadmin.
        
        is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
        user_id = current_user.get("id")

        if is_superadmin:
            # List all
            return self.repo.list_comisiones(vendedor_id=None)
        elif is_vendedor:
            # List own
            return self.repo.list_comisiones(vendedor_id=user_id)
        else:
            # If it's a regular enterprise user (even Admin/Owner of an empresa), they probably shouldn't see Vendedor commissions?
            # Or maybe they should if they pay it?
            # Request says "ADMIN / OWNER -> control total".
            # If this refers to Superadmin, then OK.
            # If it refers to Enterprise Admin, then we need to know context.
            # Given "Vendedor assigned to company", and "backend automatic generation", 
            # likely Vendedor gets commission from the System Owner (SaaS).
            # So I will assume "ADMIN" = Superadmin.
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
