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
from ..schemas_logs import LogPagoCreacion, ResumenPagos
from src.errors.app_error import AppError

class ServicioPagosFactura:
    def __init__(self, repo: RepositorioFacturas = Depends()):
        self.repo = repo

    def registrar_pago(self, datos: LogPagoCreacion, usuario_id: UUID) -> dict:
        """
        Registra un pago y actualiza el estado de la factura.
        """
        # 1. Registrar el log de pago
        payload = datos.model_dump()
        payload['usuario_id'] = usuario_id
        
        pago = self.repo.crear_pago(payload)
        if not pago:
            raise AppError("No se pudo registrar el pago", 500, "DB_ERROR")

        # 2. Calcular nuevo resumen para decidir estado_pago
        resumen = self.repo.obtener_resumen_pagos(datos.factura_id)
        
        saldo = resumen.get('saldo_pendiente', 0)
        total_factura = resumen.get('total_factura', 0)
        
        nuevo_estado_pago = 'PENDIENTE'
        if saldo <= 0:
            nuevo_estado_pago = 'PAGADO'
        elif saldo < total_factura:
            nuevo_estado_pago = 'PARCIAL'
            
        # 3. Actualizar la factura principal
        self.repo.actualizar_factura(datos.factura_id, {"estado_pago": nuevo_estado_pago})
        
        return {
            "pago": pago,
            "resumen": resumen,
            "nuevo_estado_pago": nuevo_estado_pago
        }

    def obtener_resumen(self, factura_id: UUID) -> ResumenPagos:
        """Obtiene el resumen financiero de pagos de una factura."""
        res = self.repo.obtener_resumen_pagos(factura_id)
        if not res:
            raise AppError("No se encontró información de pagos para esta factura", 404)
        return ResumenPagos(**res)

    def listar_pagos(self, factura_id: UUID) -> List[dict]:
        """Retorna el historial de abonos realizados."""
        return self.repo.listar_pagos(factura_id)
