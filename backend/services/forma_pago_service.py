from fastapi import Depends, HTTPException
from typing import List
from uuid import UUID
from decimal import Decimal

from repositories.forma_pago_repository import FormaPagoRepository
from repositories.factura_repository import FacturaRepository  # To verify invoice
from services.cuenta_cobrar_service import CuentaCobrarService # To generate AR
from models.FormaPago import FormaPagoCreate, FormaPagoUpdate, FormaPagoRead
from models.CuentaCobrar import CuentaCobrarCreate
from utils.enums import AuthKeys

class FormaPagoService:
    def __init__(
        self,
        repository: FormaPagoRepository = Depends(),
        factura_repo: FacturaRepository = Depends(),
        cuenta_cobrar_service: CuentaCobrarService = Depends()
    ):
        self.repository = repository
        self.factura_repo = factura_repo
        self.cuenta_cobrar_service = cuenta_cobrar_service

    def create(self, data: FormaPagoCreate, current_user: dict):
        # 1. Verify Factura exists and belongs to user's company
        factura = self.factura_repo.get_by_id(data.factura_id)
        if not factura:
             raise HTTPException(status_code=404, detail="Factura not found")
        
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            empresa_id = current_user.get('empresa_id')
            if not empresa_id or str(factura['empresa_id']) != str(empresa_id):
                 raise HTTPException(status_code=403, detail="No tiene permiso para agregar pagos a esta factura")
        
        # 2. Check if Invoice is editable? (Assuming mostly yes until emitted)
        if factura['estado'] == 'EMITIDA' or factura['estado'] == 'ANULADA':
             # Maybe allow adding payments after emission? Usually not for XML, but for internal record yes.
             # Requirement says: "La forma de pago se registra antes de emitir la factura al SRI."
             # So likely we should block if already emitted? 
             # Let's BLOCK for now to enforce process.
             raise HTTPException(status_code=400, detail="No se pueden modificar formas de pago de una factura emitida o anulada")

        return self.repository.create(data.model_dump())

    def list_by_factura(self, factura_id: UUID, current_user: dict):
        # Verify permissions
        factura = self.factura_repo.get_by_id(factura_id)
        if not factura:
             raise HTTPException(status_code=404, detail="Factura not found")
             
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            empresa_id = current_user.get('empresa_id')
            if str(factura['empresa_id']) != str(empresa_id):
                 raise HTTPException(status_code=403, detail="No tiene permiso para ver pagos de esta factura")
                 
        return self.repository.get_by_factura_id(factura_id)

    def delete(self, id: UUID, current_user: dict):
        payment = self.repository.get_by_id(id)
        if not payment:
             raise HTTPException(status_code=404, detail="Forma de pago no encontrada")
             
        # Verify via Factura
        factura = self.factura_repo.get_by_id(payment['factura_id'])
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            empresa_id = current_user.get('empresa_id')
            if str(factura['empresa_id']) != str(empresa_id):
                 raise HTTPException(status_code=403, detail="No tiene permiso para eliminar este pago")
        
        if factura['estado'] not in ['BORRADOR', 'PENDIENTE']:
              raise HTTPException(status_code=400, detail="No se puede eliminar pagos de facturas procesadas")

        return self.repository.delete(id)

    def update(self, id: UUID, data: FormaPagoUpdate, current_user: dict):
        payment = self.repository.get_by_id(id)
        if not payment:
             raise HTTPException(status_code=404, detail="Forma de pago no encontrada")
             
        factura = self.factura_repo.get_by_id(payment['factura_id'])
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            empresa_id = current_user.get('empresa_id')
            if str(factura['empresa_id']) != str(empresa_id):
                 raise HTTPException(status_code=403, detail="No tiene permiso para editar este pago")
                 
        if factura['estado'] not in ['BORRADOR', 'PENDIENTE']:
              raise HTTPException(status_code=400, detail="No se puede editar pagos de facturas procesadas")

        return self.repository.update(id, data.model_dump(exclude_unset=True))

    # --- Business Logic ---
    
    def validate_payments_match_invoice(self, factura_id: UUID):
        """
        Validates that the sum of all payments matches the invoice total.
        Returns True/False or raises Exception.
        """
        factura = self.factura_repo.get_by_id(factura_id)
        if not factura:
            raise HTTPException(status_code=404, detail="Factura not found")
            
        payments = self.repository.get_by_factura_id(factura_id)
        
        total_pagos = sum([p['valor'] for p in payments])
        total_factura = factura['total']
        
        # Comparison with tolerance for float/decimal issues? 
        # Using Decimal should be exact.
        if total_pagos != total_factura:
             raise HTTPException(
                 status_code=400, 
                 detail=f"La suma de formas de pago ({total_pagos}) no coincide con el total de la factura ({total_factura})"
             )
        return True

    def process_payments_for_emission(self, factura_id: UUID, current_user: dict):
        """
        Called when Invoice is being emitted.
        1. Validates total.
        2. Generates CuentaCobrar if credit.
        """
        # 1. Validate
        self.validate_payments_match_invoice(factura_id)
        
        # 2. Process Logic
        payments = self.repository.get_by_factura_id(factura_id)
        factura = self.factura_repo.get_by_id(factura_id)
        
        for p in payments:
            if p.get('plazo') and p['plazo'] > 0:
                # Calculate due date based on plazo/unidad_tiempo?
                # For now, simplistic approach: assuming 'plazo' is days if unit not specified or unit parsing.
                # But CuentaCobrarService expects dates. 
                # We need to calculate dates.
                
                from datetime import timedelta
                fecha_emision = factura['fecha_emision'] # date object hopefully
                plazo_days = p['plazo'] # int
                
                # Check unit?
                unidad = p.get('unidad_tiempo', 'dias').lower()
                if 'mes' in unidad:
                    plazo_days = plazo_days * 30 
                
                fecha_vencimiento = fecha_emision + timedelta(days=plazo_days)
                
                # Create Cuenta Cobrar
                cc_data = CuentaCobrarCreate(
                    factura_id=factura_id,
                    cliente_id=factura['cliente_id'],
                    numero_documento=factura['numero_factura'], # or similar
                    fecha_emision=fecha_emision,
                    fecha_vencimiento=fecha_vencimiento,
                    monto_total=p['valor'],
                    observaciones=f"Generado automáticamente por Forma de Pago: {p['forma_pago']}"
                )
                
                # Use service to create (handles validation logic internally)
                self.cuenta_cobrar_service.create(cc_data, current_user)
