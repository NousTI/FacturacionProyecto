from fastapi import Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from repositories.pago_factura_repository import PagoFacturaRepository
from repositories.cuenta_cobrar_repository import CuentaCobrarRepository
from repositories.factura_repository import FacturaRepository
from models.PagoFactura import PagoFacturaCreate, PagoFacturaRead
from services.cuenta_cobrar_service import CuentaCobrarService
from utils.enums import AuthKeys

class PagoFacturaService:
    def __init__(
        self, 
        repository: PagoFacturaRepository = Depends(),
        cuenta_cobrar_repo: CuentaCobrarRepository = Depends(),
        # cuenta_cobrar_service: CuentaCobrarService = Depends() # To reuse update logic
    ):
        self.repository = repository
        self.cuenta_cobrar_repo = cuenta_cobrar_repo

    def create(self, data: PagoFacturaCreate, current_user: dict) -> PagoFacturaRead:
        # 1. Validate CuentaCobrar exists and belongs to User's Company (unless Superadmin)
        cuenta = self.cuenta_cobrar_repo.get_by_id(data.cuenta_cobrar_id)
        if not cuenta:
            raise HTTPException(status_code=404, detail="Cuenta por Cobrar not found")
        
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        user_empresa_id = current_user.get('empresa_id')

        if not is_superadmin:
            if str(cuenta['empresa_id']) != str(user_empresa_id):
                 raise HTTPException(status_code=403, detail="Access denied to this Invoice")

        # 2. Register Payment
        raw_data = data.dict(exclude={'usuario_id'}) # Handle manually
        
        # Determine usuario_id
        final_usuario_id = None
        
        if is_superadmin:
            # Superadmin MUST provide a usuario_id because they are not in the 'usuario' table
            if data.usuario_id:
                final_usuario_id = data.usuario_id
                # Ideally validate this user exists (FK constraint will catch it, but better explicit? 
                # Repo create catch is fine for now or add UserRepo check)
            else:
                 raise HTTPException(status_code=400, detail="Superadmin must provide 'usuario_id' when recording a payment.")
        else:
            # Regular user is the one creating it
            final_usuario_id = current_user.get('id') if current_user.get('id') else current_user.get('sub')

        if not final_usuario_id:
             raise HTTPException(status_code=400, detail="User Identity missing")
             
        raw_data['usuario_id'] = final_usuario_id
             
        created_pago = self.repository.create(raw_data)
        if not created_pago:
            raise HTTPException(status_code=500, detail="Error creating Payment record")

        # 3. Update CuentaCobrar Balance
        # Logic: New Paid Amount = Old Paid + New Payment
        # New Saldo = Total - New Paid
        
        current_paid = cuenta['monto_pagado']
        if isinstance(current_paid, (float, int)): current_paid = Decimal(current_paid) # Ensure Decimal
        
        payment_amount = data.monto
        
        new_paid = current_paid + payment_amount
        total = cuenta['monto_total']
        if isinstance(total, (float, int)): total = Decimal(total)
        
        new_saldo = total - new_paid
        
        if new_saldo < 0:
            # Overpayment? Warn or Allow? 
            # Usually strict accounting disallows, or creates a Credit Note. 
            # For this MVP/Module, let's clamp to 0 or allow negative (Credit). 
            # Schema says CHECK (saldo_pendiente >= 0). So we MUST NOT go below 0.
            raise HTTPException(status_code=400, detail="Payment amount exceeds pending balance")
            
        new_status = 'pendiente'
        if new_saldo == 0:
            new_status = 'pagada'
        elif new_saldo < total:
            new_status = 'parcial'
            
        update_data = {
            'monto_pagado': new_paid,
            'saldo_pendiente': new_saldo,
            'estado': new_status
        }
        
        self.cuenta_cobrar_repo.update(cuenta['id'], update_data)
        
        return PagoFacturaRead(**created_pago)

    def list(self, cuenta_cobrar_id: Optional[UUID], current_user: dict) -> List[PagoFacturaRead]:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        user_empresa_id = current_user.get('empresa_id')

        # If filtered by cuenta_cobrar_id, validate access
        if cuenta_cobrar_id:
            cuenta = self.cuenta_cobrar_repo.get_by_id(cuenta_cobrar_id)
            if not cuenta:
                 raise HTTPException(status_code=404, detail="Cuenta por Cobrar not found")
            
            if not is_superadmin:
                if str(cuenta['empresa_id']) != str(user_empresa_id):
                     raise HTTPException(status_code=403, detail="Access denied")
            
            records = self.repository.list(cuenta_cobrar_id)
            return [PagoFacturaRead(**r) for r in records]
        
        # If NO filter provided
        # If NO filter provided
        if not is_superadmin:
            # Regular users MUST filter by their company's payments (complicated without joins or filtering by filter)
            # Or we force them to provide cuenta_cobrar_id?
            # Or we implement 'list_by_empresa' in repo.
            # Given constraints: "users only act according to permissions and with invoices of their company".
            # For now, let's allow "GetAll" ONLY for Superadmin. 
            # Or implement filtering by empresa in Repo (needs Join with CuentaCobrar or filtering in python).
            # Repo returns all if no ID. 
            # Let's BLOCK generic "Get All" for regular users.
             raise HTTPException(status_code=400, detail="Regular users must specify 'cuenta_cobrar_id' to list payments.")
        
        # Superadmin -> List All
        records = self.repository.list()
        return [PagoFacturaRead(**r) for r in records]
        
    def get_by_id(self, id: UUID, current_user: dict) -> PagoFacturaRead:
        record = self.repository.get_by_id(id)
        if not record:
            raise HTTPException(status_code=404, detail="Pago not found")
            
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        user_empresa_id = current_user.get('empresa_id')

        if not is_superadmin:
            # Check ownership via CuentaCobrar
            cuenta = self.cuenta_cobrar_repo.get_by_id(record['cuenta_cobrar_id'])
            # Logic: If cuenta not found (inconsistency), block access or allow? Safety first -> Block.
            if not cuenta or str(cuenta['empresa_id']) != str(user_empresa_id):
                 raise HTTPException(status_code=403, detail="Access denied")

        return PagoFacturaRead(**record)
