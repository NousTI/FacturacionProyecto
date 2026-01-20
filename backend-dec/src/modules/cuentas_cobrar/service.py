from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from decimal import Decimal

from .repository import RepositorioCuentasCobrar
from .schemas import CuentaCobrarCreacion, CuentaCobrarActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioCuentasCobrar:
    def __init__(self, repo: RepositorioCuentasCobrar = Depends()):
        self.repo = repo

    def crear_cuenta(self, datos: CuentaCobrarCreacion, usuario_actual: dict, factura_repo=None, cliente_repo=None):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            empresa_id = datos.empresa_id or usuario_actual.get('empresa_id')
        else:
            empresa_id = usuario_actual.get('empresa_id')

        if not empresa_id:
             raise AppError("Empresa ID requerido", 400, "VAL_ERROR")

        # Validation logic similar to legacy
        if factura_repo:
            factura = factura_repo.get_by_id(datos.factura_id)
            if not factura:
                 raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
            if str(factura['empresa_id']) != str(empresa_id):
                 raise AppError("La factura no pertenece a la empresa", 400, "VAL_ERROR")
            
            if datos.monto_total is None or datos.monto_total <= 0:
                 datos.monto_total = Decimal(str(factura['total']))

        if cliente_repo:
            cliente = cliente_repo.get_cliente_by_id(datos.cliente_id)
            if not cliente:
                 raise AppError("Cliente no encontrado", 404, "CLIENTE_NOT_FOUND")
            if str(cliente['empresa_id']) != str(empresa_id):
                 raise AppError("El cliente no pertenece a la empresa", 400, "VAL_ERROR")

        payload = datos.model_dump()
        payload.update({
            "empresa_id": empresa_id,
            "saldo_pendiente": datos.monto_total,
            "monto_pagado": Decimal('0.00'),
            "estado": 'pendiente',
            "dias_vencido": 0
        })

        nuevo = self.repo.crear_cuenta(payload)
        if not nuevo:
            raise AppError("Error al crear la cuenta por cobrar", 500, "DB_ERROR")
        return nuevo

    def obtener_cuenta(self, id: UUID, usuario_actual: dict):
        cuenta = self.repo.obtener_por_id(id)
        if not cuenta:
            raise AppError("Cuenta por cobrar no encontrada", 404, "CUENTA_NOT_FOUND")
        
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            if str(cuenta['empresa_id']) != str(usuario_actual.get('empresa_id')):
                 raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
        
        return cuenta

    def listar_cuentas(self, usuario_actual: dict, empresa_id: Optional[UUID] = None, cliente_id: Optional[UUID] = None, limit: int = 100, offset: int = 0):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        target_empresa_id = empresa_id if is_superadmin else usuario_actual.get('empresa_id')

        return self.repo.listar_cuentas(target_empresa_id, cliente_id, limit, offset)

    def actualizar_cuenta(self, id: UUID, datos: CuentaCobrarActualizacion, usuario_actual: dict):
        cuenta = self.obtener_cuenta(id, usuario_actual)
        
        payload = datos.model_dump(exclude_unset=True)
        if 'monto_pagado' in payload:
            monto_total = Decimal(str(cuenta['monto_total']))
            nuevo_pagado = Decimal(str(payload['monto_pagado']))
            nuevo_saldo = monto_total - nuevo_pagado
            payload['saldo_pendiente'] = nuevo_saldo
            
            if nuevo_saldo <= 0:
                payload['estado'] = 'pagada'
            elif nuevo_saldo < monto_total:
                payload['estado'] = 'parcial'
            else:
                payload['estado'] = 'pendiente'
                
        actualizado = self.repo.actualizar_cuenta(id, payload)
        if not actualizado:
            raise AppError("Error al actualizar la cuenta por cobrar", 500, "DB_ERROR")
        return actualizado

    def eliminar_cuenta(self, id: UUID, usuario_actual: dict):
        self.obtener_cuenta(id, usuario_actual)
        if not self.repo.eliminar_cuenta(id):
            raise AppError("Error al eliminar la cuenta por cobrar", 500, "DB_ERROR")
        return True
