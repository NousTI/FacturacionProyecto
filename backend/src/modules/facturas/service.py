from uuid import UUID
from typing import List, Optional
from fastapi import Depends

from .repository import RepositorioFacturas
from .schemas import FacturaCreacion, FacturaActualizacion
from ..clientes.services import ServicioClientes
from ..establecimientos.service import ServicioEstablecimientos
from ..puntos_emision.service import ServicioPuntosEmision
from ..puntos_emision.repository import RepositorioPuntosEmision
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioFacturas:
    def __init__(
        self, 
        repo: RepositorioFacturas = Depends(),
        cliente_service: ServicioClientes = Depends(),
        establecimiento_service: ServicioEstablecimientos = Depends(),
        punto_emision_service: ServicioPuntosEmision = Depends(),
        punto_emision_repo: RepositorioPuntosEmision = Depends()
    ):
        self.repo = repo
        self.cliente_service = cliente_service
        self.establecimiento_service = establecimiento_service
        self.punto_emision_service = punto_emision_service
        self.punto_emision_repo = punto_emision_repo

    def crear_factura(self, datos: FacturaCreacion, usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if not datos.empresa_id or not datos.usuario_id:
                raise AppError("Superadmin debe especificar 'empresa_id' y 'usuario_id'", 400, "VAL_ERROR")
            target_empresa_id = datos.empresa_id
            target_usuario_id = datos.usuario_id
        else:
            target_empresa_id = usuario_actual.get("empresa_id")
            target_usuario_id = usuario_actual.get("id")
            
            if datos.empresa_id and str(datos.empresa_id) != str(target_empresa_id):
                 raise AppError("No puede crear facturas para otra empresa", 403, "AUTH_FORBIDDEN")
            if datos.usuario_id and str(datos.usuario_id) != str(target_usuario_id):
                 raise AppError("No puede asignar la facura a otro usuario", 403, "AUTH_FORBIDDEN")

        # Validate Related Entities (reuses their services)
        self.cliente_service.obtener_cliente(datos.cliente_id, usuario_actual)
        establecimiento = self.establecimiento_service.obtener_establecimiento(datos.establecimiento_id, usuario_actual)
        punto = self.punto_emision_service.obtener_punto(datos.punto_emision_id, usuario_actual)

        if str(punto['establecimiento_id']) != str(datos.establecimiento_id):
             raise AppError("El punto de emisión no pertenece al establecimiento indicado", 400, "VAL_ERROR")

        # Generate Sequential Number
        current_seq_val = self.punto_emision_repo.incrementar_secuencial(datos.punto_emision_id)
        if current_seq_val is None:
             raise AppError("Error al generar secuencial", 500, "DB_ERROR")

        numero_factura = f"{establecimiento['codigo']}-{punto['codigo']}-{current_seq_val:09d}"
        
        payload = datos.model_dump()
        payload.update({
            "empresa_id": target_empresa_id,
            "usuario_id": target_usuario_id,
            "numero_factura": numero_factura,
            "estado": 'PENDIENTE',
            "estado_pago": 'PENDIENTE'
        })

        try:
            nueva = self.repo.crear_factura(payload)
            if not nueva:
                raise AppError("Error al crear la factura", 500, "DB_ERROR")
            return nueva
        except Exception as e:
            raise e

    def listar_facturas(self, usuario_actual: dict, empresa_id: Optional[UUID] = None, limit: int = 100, offset: int = 0):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        target_empresa_id = None
        if is_superadmin:
            if empresa_id: target_empresa_id = empresa_id
        else:
            target_empresa_id = usuario_actual["empresa_id"]
            
        return self.repo.listar_facturas(target_empresa_id, limit, offset)

    def obtener_factura(self, id: UUID, usuario_actual: dict):
        factura = self.repo.obtener_por_id(id)
        if not factura:
            raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")

        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
             if str(factura['empresa_id']) != str(usuario_actual["empresa_id"]):
                  raise AppError("No tiene permiso para ver esta factura", 403, "AUTH_FORBIDDEN")

        return factura

    def actualizar_factura(self, id: UUID, datos: FacturaActualizacion, usuario_actual: dict, forma_pago_service=None):
        factura = self.obtener_factura(id, usuario_actual)
        
        # Emission Logic Trigger (This should ideally be its own endpoint / process)
        if datos.estado == 'EMITIDA' and factura.estado != 'EMITIDA':
             if forma_pago_service:
                 # We would need to pass the dependencies here or have them injected
                 # In this modular architecture, cross-service calls are fine.
                 forma_pago_service.procesar_pagos_emision(id, usuario_actual, self.repo, None) # AR Service None for now
        
        payload = datos.model_dump(exclude_unset=True)
        if not payload: return factura
        
        actualizada = self.repo.actualizar_factura(id, payload)
        if not actualizada:
             raise AppError("Error al actualizar la factura", 500, "DB_ERROR")
        return actualizada

    def eliminar_factura(self, id: UUID, usuario_actual: dict):
        self.obtener_factura(id, usuario_actual)
        if not self.repo.eliminar_factura(id):
            raise AppError("Error al eliminar la factura", 500, "DB_ERROR")
        return True

    # --- Detalles ---
    def agregar_detalle(self, datos: dict, usuario_actual: dict):
        self.obtener_factura(datos['factura_id'], usuario_actual)
        return self.repo.crear_detalle(datos)

    def listar_detalles(self, factura_id: UUID, usuario_actual: dict):
        self.obtener_factura(factura_id, usuario_actual)
        return self.repo.listar_detalles(factura_id)

    def actualizar_detalle(self, id: UUID, datos: dict, usuario_actual: dict):
        detalle = self.repo.obtener_detalle(id)
        if not detalle: raise AppError("Detalle no encontrado", 404, "DETALLE_NOT_FOUND")
        self.obtener_factura(detalle['factura_id'], usuario_actual)
        return self.repo.actualizar_detalle(id, datos)

    def eliminar_detalle(self, id: UUID, usuario_actual: dict):
        detalle = self.repo.obtener_detalle(id)
        if not detalle: raise AppError("Detalle no encontrado", 404, "DETALLE_NOT_FOUND")
        self.obtener_factura(detalle['factura_id'], usuario_actual)
        return self.repo.eliminar_detalle(id)
