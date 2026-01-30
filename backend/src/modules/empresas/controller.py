from fastapi import Depends
from datetime import datetime
from .services import ServicioEmpresas
from ..suscripciones.services import ServicioSuscripciones
from .schemas import EmpresaCreacion, EmpresaActualizacion, EmpresaAsignarVendedor
from uuid import UUID
from ...utils.response import success_response

class EmpresaController:
    def __init__(
        self, 
        service: ServicioEmpresas = Depends(),
        suscripcion_service: ServicioSuscripciones = Depends()
    ):
        self.service = service
        self.suscripcion_service = suscripcion_service

    def crear_empresa(self, body: EmpresaCreacion, usuario_actual: dict):
        nueva = self.service.crear_empresa(body, usuario_actual)
        return success_response(nueva, "Empresa creada exitosamente")

    def obtener_empresa(self, empresa_id: UUID, usuario_actual: dict):
        empresa = self.service.obtener_empresa(empresa_id, usuario_actual)
        return success_response(empresa)

    def listar_empresas(self, usuario_actual: dict, vendedor_id: UUID = None):
        empresas = self.service.listar_empresas(usuario_actual, vendedor_id)
        return success_response(empresas)

    def obtener_estadisticas(self, usuario_actual: dict):
        stats = self.service.obtener_estadisticas(usuario_actual)
        return success_response(stats)

    def actualizar_empresa(self, empresa_id: UUID, body: EmpresaActualizacion, usuario_actual: dict):
        actualizada = self.service.actualizar_empresa(empresa_id, body, usuario_actual)
        return success_response(actualizada, "Empresa actualizada correctamente")

    def eliminar_empresa(self, empresa_id: UUID, usuario_actual: dict):
        self.service.eliminar_empresa(empresa_id, usuario_actual)
        return success_response(None, "Empresa eliminada correctamente")

    def toggle_active(self, empresa_id: UUID, usuario_actual: dict):
        actualizada = self.service.toggle_active(empresa_id, usuario_actual)
        return success_response(actualizada, "Estado actualizado correctamente")

    def asignar_vendedor(self, empresa_id: UUID, body: EmpresaAsignarVendedor, usuario_actual: dict):
        actualizada = self.service.assign_vendor(empresa_id, body.vendedor_id, usuario_actual)
        return success_response(actualizada, "Vendedor asignado correctamente")

    def cambiar_plan(self, empresa_id: UUID, body: dict, usuario_actual: dict):
        # Delegate to suscripcion service but through empresa flow if needed
        # Or just use the existing logic in suscripcion service
        from ..suscripciones.schemas import PagoSuscripcionQuick
        pago_data = PagoSuscripcionQuick(
            empresa_id=empresa_id,
            plan_id=body.get('plan_id'),
            monto=body.get('monto'),
            metodo_pago="MANUAL_SUPERADMIN",
            numero_comprobante=f"CAMBIO_PLAN_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        )
        resultado = self.suscripcion_service.registrar_pago_rapido(pago_data, usuario_actual)
        # Fetch updated empresa to return it
        actualizada = self.service.obtener_empresa(empresa_id, usuario_actual)
        return success_response(actualizada, "Plan actualizado correctamente")
