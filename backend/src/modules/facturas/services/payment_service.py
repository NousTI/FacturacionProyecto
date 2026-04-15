"""
Servicio especializado en la Gestión de Pagos de Facturas.

Maneja:
- Registro de abonos/pagos totales.
- Actualización automática del 'estado_pago' de la factura principal.
- Historial de transacciones de pago.
"""

from uuid import UUID
from typing import List, Optional
from fastapi import Depends
from ..repository import RepositorioFacturas
from ...cuentas_cobrar.repository import RepositorioCuentasCobrar
from ...pagos_factura.repository import RepositorioPagosFactura
from ..schemas_logs import LogPagoCreacion, ResumenPagos
from src.errors.app_error import AppError
import string
import random
from datetime import date
from decimal import Decimal

class ServicioPagosFactura:
    def __init__(
        self, 
        repo: RepositorioFacturas = Depends(),
        cw_repo: RepositorioCuentasCobrar = Depends(),
        pagos_repo: RepositorioPagosFactura = Depends()
    ):
        self.repo = repo
        self.cw_repo = cw_repo
        self.pagos_repo = pagos_repo

    def registrar_pago(self, datos: LogPagoCreacion, usuario_id: UUID) -> dict:
        """Registra un pago y actualiza la cuenta y factura de forma completamente atómica."""
        from src.database.transaction import db_transaction

        factura_id = datos.factura_id
        
        # 1. Obtener la cuenta por cobrar atada a la factura
        cuentas = self.cw_repo.listar_cuentas(factura_id=factura_id)
        cuenta = cuentas[0] if cuentas else None
            
        if not cuenta:
            raise AppError("No existe una cuenta por cobrar para esta factura", 404)

        # 2. Cálculos de balances y estados
        current_paid = Decimal(str(cuenta['monto_pagado']))
        payment_amount = Decimal(str(datos.monto))
        new_paid = current_paid + payment_amount
        total = Decimal(str(cuenta['monto_total']))
        new_saldo = total - new_paid
        
        if new_saldo < 0:
             raise AppError("El monto del pago excede el saldo pendiente", 400, "VAL_ERROR")
             
        new_status = 'pagado' if new_saldo == 0 else ('vencido' if cuenta.get('estado') == 'vencido' else 'pendiente')
        nuevo_estado_pago = 'PAGADO' if new_saldo == 0 else ('PARCIAL' if new_saldo < total else 'PENDIENTE')

        recibo = "RCB-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        factura = self.repo.obtener_por_id(factura_id)
        if not factura:
            raise AppError("Factura no encontrada", 404)
        
        if factura.get('estado') != 'AUTORIZADA':
            raise AppError("No se pueden registrar pagos en facturas que no han sido autorizadas por el SRI.", 400, "VAL_ERROR")
            
        id_usuario_valido = factura.get('usuario_id')
        
        # 3. Determinar método de pago (si no viene en datos, usar el de la factura)
        metodo_pago_final = datos.metodo_pago_sri
        if not metodo_pago_final:
            pagos_base = self.repo.db.cursor().execute("SELECT forma_pago_sri FROM sistema_facturacion.formas_pago WHERE factura_id = %s", (str(factura_id),))
            # Necesitamos el cursor real o usar el repo corporativo.
            # Mejor usamos self.repo para consistencia si es posible, o una consulta rápida.
            with self.repo.db.cursor() as cur_check:
                cur_check.execute("SELECT forma_pago_sri FROM sistema_facturacion.formas_pago WHERE factura_id = %s", (str(factura_id),))
                row_p = cur_check.fetchone()
                metodo_pago_final = row_p['forma_pago_sri'] if row_p else '01'

        payload = {
            "cuenta_cobrar_id": str(cuenta['id']),
            "usuario_id": str(id_usuario_valido),
            "numero_recibo": datos.numero_recibo or recibo,
            "fecha_pago": str(datos.fecha_pago or date.today()),
            "monto": float(datos.monto),
            "metodo_pago_sri": metodo_pago_final,
            "observaciones": datos.observaciones
        }
        
        # TRANSACCIÓN ATÓMICA
        with db_transaction(self.repo.db) as cur:
            # 1. Registrar pago
            pago = self.pagos_repo.crear_pago(payload, cur=cur)
            
            # 2. Actualizar cuenta_cobrar
            self.cw_repo.actualizar_por_factura(factura_id, {
                'monto_pagado': float(new_paid),
                'saldo_pendiente': float(new_saldo),
                'estado': new_status
            }, cur=cur)
            
            # 3. Actualizar factura principal
            self.repo.actualizar_factura(factura_id, {"estado_pago": nuevo_estado_pago}, cur=cur)
            
        return {
            "pago": pago,
            "resumen": {"total_factura": float(total), "saldo_pendiente": float(new_saldo), "monto_pagado": float(new_paid)},
            "nuevo_estado_pago": nuevo_estado_pago
        }

    def obtener_resumen(self, factura_id: UUID) -> ResumenPagos:
        """Obtiene el resumen financiero de pagos de una factura."""
        query = "SELECT id, monto_total, monto_pagado, saldo_pendiente FROM sistema_facturacion.cuentas_cobrar WHERE factura_id = %s"
        with self.cw_repo.db.cursor() as cur:
            cur.execute(query, (str(factura_id),))
            row = cur.fetchone()
            if not row:
                raise AppError("No se encontró información de pagos", 404)
            
            # Convertir a dict si es necesario para asegurar acceso por nombre
            cuenta = dict(row)
            
            # Count payments
            cur.execute("SELECT COUNT(*) as total FROM sistema_facturacion.pagos_factura WHERE cuenta_cobrar_id = %s", (str(cuenta['id']),))
            res_count = cur.fetchone()
            count = res_count['total'] if res_count else 0
            
            return ResumenPagos(
                total_factura=float(cuenta['monto_total']),
                monto_pagado=float(cuenta['monto_pagado']),
                saldo_pendiente=float(cuenta['saldo_pendiente']),
                cantidad_pagos=count
            )

    def listar_pagos(self, factura_id: UUID) -> List[dict]:
        """Retorna el historial de abonos realizados."""
        query = "SELECT id FROM sistema_facturacion.cuentas_cobrar WHERE factura_id = %s"
        with self.cw_repo.db.cursor() as cur:
            cur.execute(query, (str(factura_id),))
            row = cur.fetchone()
            if not row: return []
            
            # Asegurar acceso por nombre dictando la fila
            cuenta = dict(row)
            
        return self.pagos_repo.listar_por_cuenta(cuenta['id'])
