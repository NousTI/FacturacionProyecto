from fastapi import Depends
from .services import ServicioClientes
from .schemas import ClienteCreacion, ClienteActualizacion
from uuid import UUID
from typing import Optional
from ...utils.response import success_response

class ClienteController:
    def __init__(self, service: ServicioClientes = Depends()):
        self.service = service

    def crear_cliente(self, body: ClienteCreacion, usuario_actual: dict):
        nuevo = self.service.crear_cliente(body, usuario_actual)
        return success_response(nuevo, "Cliente creado exitosamente")

    def listar_clientes(self, usuario_actual: dict, empresa_id: Optional[UUID] = None):
        clientes = self.service.listar_clientes(usuario_actual, empresa_id)
        return success_response(clientes)

    def obtener_cliente(self, id: UUID, usuario_actual: dict):
        cliente = self.service.obtener_cliente(id, usuario_actual)
        return success_response(cliente)

    def actualizar_cliente(self, id: UUID, body: ClienteActualizacion, usuario_actual: dict):
        actualizado = self.service.actualizar_cliente(id, body, usuario_actual)
        return success_response(actualizado, "Cliente actualizado correctamente")

    def eliminar_cliente(self, id: UUID, usuario_actual: dict):
        self.service.eliminar_cliente(id, usuario_actual)
        return success_response(None, "Cliente eliminado correctamente")
