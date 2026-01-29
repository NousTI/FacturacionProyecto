from fastapi import Depends
from .services import ServicioVendedores
from .schemas import VendedorCreacion, VendedorActualizacion, ReasignacionEmpresas
from uuid import UUID
from ...utils.response import success_response

class VendedorController:
    def __init__(self, service: ServicioVendedores = Depends()):
        self.service = service

    def crear_vendedor(self, body: VendedorCreacion, usuario_actual: dict):
        nuevo = self.service.crear_vendedor(body, usuario_actual)
        return success_response(nuevo, "Vendedor creado exitosamente")

    def listar_vendedores(self, usuario_actual: dict):
        vendedores = self.service.listar_vendedores(usuario_actual)
        return success_response(vendedores)

    def obtener_vendedor(self, id: UUID, usuario_actual: dict):
        vendedor = self.service.obtener_vendedor(id, usuario_actual)
        return success_response(vendedor)

    def obtener_stats(self, usuario_actual: dict):
        stats = self.service.obtener_stats_vendedores(usuario_actual)
        return success_response(stats)

    def actualizar_vendedor(self, id: UUID, body: VendedorActualizacion, usuario_actual: dict):
        actualizado = self.service.actualizar_vendedor(id, body, usuario_actual)
        return success_response(actualizado, "Vendedor actualizado correctamente")

    def toggle_status(self, id: UUID, usuario_actual: dict):
        actualizado = self.service.toggle_status_vendedor(id, usuario_actual)
        return success_response(actualizado, "Estado actualizado correctamente")

    def reasignar_empresas(self, id: UUID, body: ReasignacionEmpresas, usuario_actual: dict):
        resultado = self.service.reasignar_empresas_vendedor(id, body, usuario_actual)
        return success_response(resultado, "Reasignación completada")

    def obtener_empresas(self, id: UUID, usuario_actual: dict):
        empresas = self.service.obtener_empresas_vendedor(id, usuario_actual)
        return success_response(empresas)

    def eliminar_vendedor(self, id: UUID, usuario_actual: dict):
        self.service.eliminar_vendedor(id, usuario_actual)
        return success_response(None, "Vendedor eliminado correctamente")
