from fastapi import Depends
from .services import ServicioSuscripciones
from .schemas import (
    PlanCreacion, PlanUpdate, PagoSuscripcionQuick,
    SuscripcionCreacion, SuscripcionActualizacion
)
from uuid import UUID
from typing import Optional
from ...utils.response import success_response

class SuscripcionController:
    def __init__(self, service: ServicioSuscripciones = Depends()):
        self.service = service

    # --- Planes ---
    def listar_planes(self):
        planes = self.service.listar_planes()
        return success_response(planes)
    
    def obtener_plan(self, id: UUID):
        plan = self.service.obtener_plan(id)
        return success_response(plan)
    
    def crear_plan(self, body: PlanCreacion, usuario_actual: dict):
        nuevo = self.service.crear_plan(body, usuario_actual)
        return success_response(nuevo, "Plan creado exitosamente")
    
    def actualizar_plan(self, id: UUID, body: PlanUpdate, usuario_actual: dict):
        actualizado = self.service.actualizar_plan(id, body, usuario_actual)
        return success_response(actualizado, "Plan actualizado correctamente")
    
    def eliminar_plan(self, id: UUID, usuario_actual: dict):
        self.service.eliminar_plan(id, usuario_actual)
        return success_response(None, "Plan eliminado correctamente")
    
    def listar_empresas_por_plan(self, plan_id: UUID, usuario_actual: dict):
        empresas = self.service.listar_empresas_por_plan(plan_id, usuario_actual)
        return success_response(empresas)
    
    # --- Pagos ---
    def registrar_pago_rapido(self, body: PagoSuscripcionQuick, usuario_actual: dict):
        resultado = self.service.registrar_pago_rapido(body, usuario_actual)
        return success_response(resultado, "Pago registrado")
    
    def listar_pagos(self, usuario_actual: dict, empresa_id: Optional[UUID] = None):
        pagos = self.service.listar_pagos(usuario_actual, empresa_id)
        return success_response(pagos)
    
    # --- Stats ---
    def obtener_stats_dashboard(self, usuario_actual: dict):
        stats = self.service.obtener_stats_dashboard(usuario_actual)
        return success_response(stats)
    
    # --- Suscripciones Lifecycle ---
    def activar_suscripcion(self, body: SuscripcionCreacion, usuario_actual: dict):
        suscripcion = self.service.activar_suscripcion(
            body.empresa_id, body.plan_id, body.fecha_inicio, 
            body.fecha_fin, usuario_actual
        )
        return success_response(suscripcion, "Suscripción activada")
    
    def cancelar_suscripcion(self, empresa_id: UUID, observaciones: str, usuario_actual: dict):
        suscripcion = self.service.cancelar_suscripcion(empresa_id, observaciones, usuario_actual)
        return success_response(suscripcion, "Suscripción cancelada")
    
    def suspender_suscripcion(self, empresa_id: UUID, observaciones: str, usuario_actual: dict):
        suscripcion = self.service.suspender_suscripcion(empresa_id, observaciones, usuario_actual)
        return success_response(suscripcion, "Suscripción suspendida")
    
    def verificar_vencimientos(self, usuario_actual: dict):
        resultado = self.service.verificar_vencimientos(usuario_actual)
        return success_response(resultado, "Verificación completada")
    
    # --- Audit Log ---
    def obtener_historial_suscripcion(self, empresa_id: UUID, usuario_actual: dict):
        historial = self.service.obtener_historial_suscripcion(empresa_id, usuario_actual)
        return success_response(historial)

