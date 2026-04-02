from fastapi import Depends
from fastapi.responses import StreamingResponse
from datetime import datetime
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

    def obtener_stats(self, usuario_actual: dict):
        stats = self.service.obtener_stats(usuario_actual)
        return success_response(stats)

    def exportar_clientes(self, usuario_actual: dict, start_date: Optional[str] = None, end_date: Optional[str] = None):
        output = self.service.exportar_clientes(usuario_actual, start_date, end_date)
        filename = f"clientes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    # ---- Analítica -----------------------------------------------

    def obtener_nuevos_por_mes(self, usuario_actual: dict, meses: int = 6):
        data = self.service.obtener_nuevos_por_mes(usuario_actual, meses)
        return success_response(data)

    def obtener_top_clientes(
        self,
        usuario_actual: dict,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None,
        criterio: str = "monto",
        limit: int = 10,
    ):
        data = self.service.obtener_top_clientes(usuario_actual, fecha_inicio, fecha_fin, criterio, limit)
        return success_response(data)

    def obtener_clientes_inactivos(self, usuario_actual: dict, dias: int = 90):
        data = self.service.obtener_clientes_inactivos(usuario_actual, dias)
        return success_response(data)

    def obtener_analisis_clientes(self, usuario_actual: dict, periodo_meses: int = 3):
        data = self.service.obtener_analisis_clientes(usuario_actual, periodo_meses)
        return success_response(data)
