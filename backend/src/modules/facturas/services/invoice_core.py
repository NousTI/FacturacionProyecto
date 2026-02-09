"""
Servicio Core de Facturas.
Maneja el CRUD básico y la integridad de los snapshots.
"""

from uuid import UUID
from datetime import datetime
from typing import Optional, List
from fastapi import Depends

from ..repository import RepositorioFacturas
from ..schemas import FacturaCreacion, FacturaActualizacion, FacturaListadoFiltros
from ...clientes.services import ServicioClientes
from ...establecimientos.service import ServicioEstablecimientos
from ...puntos_emision.service import ServicioPuntosEmision
from ...puntos_emision.repository import RepositorioPuntosEmision
from ...empresas.services import ServicioEmpresas
from src.constants.enums import AuthKeys
from src.errors.app_error import AppError

class ServicioFacturaCore:
    def __init__(
        self, 
        repo: RepositorioFacturas = Depends(),
        cliente_service: ServicioClientes = Depends(),
        establecimiento_service: ServicioEstablecimientos = Depends(),
        punto_emision_service: ServicioPuntosEmision = Depends(),
        punto_emision_repo: RepositorioPuntosEmision = Depends(),
        empresa_service: ServicioEmpresas = Depends()
    ):
        self.repo = repo
        self.cliente_service = cliente_service
        self.establecimiento_service = establecimiento_service
        self.punto_emision_service = punto_emision_service
        self.punto_emision_repo = punto_emision_repo
        self.empresa_service = empresa_service

    def crear_borrador(self, datos: FacturaCreacion, usuario_actual: dict, snapshots_logic: dict):
        """Lógica para crear la factura en base de datos con sus snapshots."""
        # Se asume que las validaciones de negocio ya se hicieron en el orquestador
        payload = datos.model_dump()
        payload.update({
            "estado": 'BORRADOR',
            "estado_pago": 'PENDIENTE',
            **snapshots_logic
        })
        
        nueva = self.repo.crear_factura(payload)
        if not nueva:
            raise AppError("Error al crear la factura", 500, "DB_ERROR")
        return nueva

    def obtener_factura(self, id: UUID) -> dict:
        factura = self.repo.obtener_por_id(id)
        if not factura:
            raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
        return factura

    def actualizar_factura(self, id: UUID, datos_dict: dict):
        return self.repo.actualizar_factura(id, datos_dict)

    def recalcular_totales(self, factura_id: UUID):
        """
        Recalcula los totales de la factura basándose en sus detalles actuales.
        Sincroniza los campos monetarios de la tabla facturas.
        """
        detalles = self.repo.listar_detalles(factura_id)
        factura = self.obtener_factura(factura_id)

        subtotal_sin_iva = 0
        subtotal_con_iva = 0
        total_iva = 0
        descuento_detalles = 0

        for d in detalles:
            subtotal_detalle = float(d.get('subtotal', 0))
            valor_iva_detalle = float(d.get('valor_iva', 0))
            tipo_iva = d.get('tipo_iva', '0')
            
            # Clasificar según si tiene IVA o no
            if tipo_iva == '0' or valor_iva_detalle == 0:
                # Sin IVA
                subtotal_sin_iva += subtotal_detalle
            else:
                # Con IVA
                subtotal_con_iva += subtotal_detalle
                total_iva += valor_iva_detalle
            
            descuento_detalles += float(d.get('descuento', 0))
        
        # Otros valores actuales de la factura
        propina = float(factura.get('propina', 0))
        retencion_iva = float(factura.get('retencion_iva', 0))
        retencion_renta = float(factura.get('retencion_renta', 0))
        descuento_global = float(factura.get('descuento', 0))
        
        # Total = subtotal_sin_iva + subtotal_con_iva + iva + propina - descuento - retenciones
        total_calculado = subtotal_sin_iva + subtotal_con_iva + total_iva + propina - descuento_global - retencion_iva - retencion_renta
        
        update_data = {
            "subtotal_sin_iva": round(subtotal_sin_iva, 2),
            "subtotal_con_iva": round(subtotal_con_iva, 2),
            "iva": round(total_iva, 2),
            "total": round(total_calculado, 2)
        }
        
        return self.repo.actualizar_factura(factura_id, update_data)
