from fastapi import Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date

from repositories.cuenta_cobrar_repository import CuentaCobrarRepository
from models.CuentaCobrar import CuentaCobrarCreate, CuentaCobrarUpdate, CuentaCobrarRead
from utils.enums import PermissionCodes, AuthKeys

from repositories.cliente_repository import ClienteRepository

from repositories.factura_repository import FacturaRepository

class CuentaCobrarService:
    def __init__(
        self, 
        repository: CuentaCobrarRepository = Depends(),
        cliente_repository: ClienteRepository = Depends(),
        factura_repository: FacturaRepository = Depends()
    ):
        self.repository = repository
        self.cliente_repository = cliente_repository
        self.factura_repository = factura_repository

    def create(self, data: CuentaCobrarCreate, current_user: dict) -> CuentaCobrarRead:
        # 1. Determine Empresa ID
        empresa_id = None
        
        if current_user.get(AuthKeys.IS_SUPERADMIN):
            # Superadmin can provide empresa_id in payload OR use context
            if data.empresa_id:
                empresa_id = data.empresa_id
            else:
                empresa_id = current_user.get('empresa_id') # Fallback if they have a context
        else:
            # Regular user MUST use their context
            empresa_id = current_user.get('empresa_id')

        if not empresa_id:
             raise HTTPException(status_code=400, detail="Empresa ID required. Superadmins must specify 'empresa_id' in body or have context.")

        # 2. Validate Factura Exists and Get Total
        factura = self.factura_repository.get_by_id(data.factura_id)
        if not factura:
             raise HTTPException(status_code=404, detail="Factura not found")
        
        # Verify Factura belongs to Empresa
        if str(factura['empresa_id']) != str(empresa_id):
             raise HTTPException(status_code=400, detail="Factura does not belong to the specified Empresa")

        # 3. Determine Amount
        if data.monto_total is not None and data.monto_total > 0:
            final_total = data.monto_total
        else:
            # Auto-assign from Factura
            final_total = factura['total']
            if isinstance(final_total, float): final_total = Decimal(str(final_total))
            elif isinstance(final_total, (str, int)): final_total = Decimal(final_total)

        if final_total <= 0:
             raise HTTPException(status_code=400, detail="Monto total cannot be zero")

        # 4. Validate Client belongs to Empresa
        cliente = self.cliente_repository.get_cliente_by_id(data.cliente_id)
        if not cliente:
             raise HTTPException(status_code=404, detail="Cliente not found")
        
        if str(cliente['empresa_id']) != str(empresa_id):
             raise HTTPException(status_code=400, detail="Client does not belong to the specified Empresa")

        # 5. Prepare Data
        saldo_pending = final_total
        
        raw_data = data.dict(exclude={'empresa_id', 'monto_total'}) # Exclude manual field if needed
        raw_data['empresa_id'] = empresa_id
        raw_data['monto_total'] = final_total
        raw_data['saldo_pendiente'] = saldo_pending
        raw_data['monto_pagado'] = Decimal('0.00')
        raw_data['estado'] = 'pendiente'
        raw_data['dias_vencido'] = 0
        
        # Determine status based on dates? Default is 'pendiente'.

        created = self.repository.create(raw_data)
        if not created:
            raise HTTPException(status_code=500, detail="Error creating Cuenta por Cobrar")
        return CuentaCobrarRead(**created)

    def get_by_id(self, id: UUID, current_user: dict) -> CuentaCobrarRead:
        record = self.repository.get_by_id(id)
        if not record:
            raise HTTPException(status_code=404, detail="Cuenta por Cobrar not found")
        
        # Security check
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            if str(record['empresa_id']) != str(current_user.get('empresa_id')):
                 raise HTTPException(status_code=403, detail="Access denied")
        
        return CuentaCobrarRead(**record)

    def list(self, current_user: dict, empresa_id: Optional[UUID] = None, cliente_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[CuentaCobrarRead]:
        # Determine context
        user_empresa_id = current_user.get('empresa_id')
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        
        target_empresa_id = None

        if not is_superadmin:
            # Regular user: MUST be restricted to their company
            if not user_empresa_id:
                raise HTTPException(status_code=400, detail="User context missing empresa_id")
            # Force the filter to be their company
            target_empresa_id = user_empresa_id
        else:
            # Superadmin: Use the provided query param, OR the context, OR None (for all)
            # If 'empresa_id' param is provided, use it.
            # Else if 'user_empresa_id' is present (e.g. impersonating), use it? 
            # Or if explicit None, maybe they want global view.
            # Let's prioritize the explicit argument 'empresa_id' from the route.
            target_empresa_id = empresa_id if empresa_id else None
            # If target_empresa_id is None, repository will return all.

        records = self.repository.list(target_empresa_id, cliente_id, limit, offset)
        return [CuentaCobrarRead(**r) for r in records]

    def update(self, id: UUID, data: CuentaCobrarUpdate, current_user: dict) -> CuentaCobrarRead:
        record = self.repository.get_by_id(id)
        if not record:
            raise HTTPException(status_code=404, detail="Cuenta por Cobrar not found")

        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            if str(record['empresa_id']) != str(current_user.get('empresa_id')):
                 raise HTTPException(status_code=403, detail="Access denied")
        
        # Prepare update data
        update_data = data.dict(exclude_unset=True)
        
        # Recalculate logic if amounts change
        # Note: If API sends 'monto_pagado', we should likely recalculate 'saldo_pendiente' automatically
        # BUT the user might send both. Let's trust the user or enforce logic.
        # Enforcing logic is safer:
        # new_saldo = total - new_pagado
        
        current_total = record['monto_total'] # Should be Decimal
        
        if 'monto_pagado' in update_data:
            new_pagado = update_data['monto_pagado']
            new_saldo = current_total - new_pagado
            update_data['saldo_pendiente'] = new_saldo
            
            if new_saldo <= 0:
                update_data['estado'] = 'pagada'
            elif new_saldo < current_total:
                update_data['estado'] = 'parcial'
            else:
                update_data['estado'] = 'pendiente'
                
        updated = self.repository.update(id, update_data)
        if not updated:
            raise HTTPException(status_code=500, detail="Error updating Cuenta por Cobrar")
            
        return CuentaCobrarRead(**updated)

    def delete(self, id: UUID, current_user: dict):
        record = self.repository.get_by_id(id)
        if not record:
            raise HTTPException(status_code=404, detail="Cuenta por Cobrar not found")

        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            if str(record['empresa_id']) != str(current_user.get('empresa_id')):
                 raise HTTPException(status_code=403, detail="Access denied")

        success = self.repository.delete(id)
        if not success:
            raise HTTPException(status_code=500, detail="Error deleting Cuenta por Cobrar")
