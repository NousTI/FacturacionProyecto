from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from decimal import Decimal

from .repository import RepositorioPagosFactura
from .schemas import PagoFacturaCreacion
from ..cuentas_cobrar.repository import RepositorioCuentasCobrar
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioPagosFactura:
    def __init__(
        self, 
        repo: RepositorioPagosFactura = Depends(),
        cuenta_repo: RepositorioCuentasCobrar = Depends()
    ):
        self.repo = repo
        self.cuenta_repo = cuenta_repo

    def crear_pago(self, datos: PagoFacturaCreacion, usuario_actual: dict):
        cuenta = self.cuenta_repo.obtener_por_id(datos.cuenta_cobrar_id)
        if not cuenta:
             raise AppError("Cuenta por cobrar no encontrada", 404, "CUENTA_NOT_FOUND")
             
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            if str(cuenta['empresa_id']) != str(usuario_actual.get('empresa_id')):
                 raise AppError("No tiene permiso para registrar pagos a esta factura", 403, "AUTH_FORBIDDEN")
                 
        usuario_id = datos.usuario_id or usuario_actual.get('id')
        if not usuario_id and is_superadmin:
             raise AppError("Superadmin debe especificar usuario_id", 400, "VAL_ERROR")
        
        payload = datos.model_dump()
        payload['usuario_id'] = usuario_id or usuario_actual.get('id')

        # Atomicity check (manual for now as per legacy)
        nuevo_pago = self.repo.crear_pago(payload)
        if not nuevo_pago:
            raise AppError("Error al registrar el pago", 500, "DB_ERROR")

        # Update balance
        current_paid = Decimal(str(cuenta['monto_pagado']))
        payment_amount = datos.monto
        new_paid = current_paid + payment_amount
        total = Decimal(str(cuenta['monto_total']))
        new_saldo = total - new_paid
        
        if new_saldo < 0:
             raise AppError("El monto del pago excede el saldo pendiente", 400, "VAL_ERROR")
             
        new_status = 'pagada' if new_saldo == 0 else ('parcial' if new_saldo < total else 'pendiente')
        
        self.cuenta_repo.actualizar_cuenta(cuenta['id'], {
            'monto_pagado': new_paid,
            'saldo_pendiente': new_saldo,
            'estado': new_status
        })

        return nuevo_pago

    def listar_pagos(self, cuenta_cobrar_id: Optional[UUID], usuario_actual: dict, limit: int = 100, offset: int = 0):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if cuenta_cobrar_id:
            cuenta = self.cuenta_repo.obtener_por_id(cuenta_cobrar_id)
            if not cuenta:
                 raise AppError("Cuenta por cobrar no encontrada", 404, "CUENTA_NOT_FOUND")
            if not is_superadmin and str(cuenta['empresa_id']) != str(usuario_actual.get('empresa_id')):
                 raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
            return self.repo.listar_por_cuenta(cuenta_cobrar_id, limit, offset)
            
        if not is_superadmin:
             raise AppError("Debe especificar cuenta_cobrar_id", 400, "VAL_ERROR")

        return self.repo.listar_todos(limit, offset)

    def obtener_pago(self, id: UUID, usuario_actual: dict):
        pago = self.repo.obtener_por_id(id)
        if not pago:
            raise AppError("Pago no encontrado", 404, "PAGO_NOT_FOUND")
            
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            cuenta = self.cuenta_repo.obtener_por_id(pago['cuenta_cobrar_id'])
            if not cuenta or str(cuenta['empresa_id']) != str(usuario_actual.get('empresa_id')):
                 raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
                 
        return pago
