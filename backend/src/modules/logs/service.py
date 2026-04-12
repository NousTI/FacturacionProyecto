from fastapi import Depends
from typing import List, Dict, Any
from uuid import UUID
from datetime import datetime

from .repository import RepositorioLogs
from .schemas import LogEmisionCreacion
from ...errors.app_error import AppError
from ...utils.excel_generator import generate_excel_report

class ServicioLogs:
    def __init__(self, repo: RepositorioLogs = Depends()):
        self.repo = repo

    def crear_log(self, datos: LogEmisionCreacion):
        res = self.repo.crear_log(datos.model_dump())
        if not res: raise AppError("Error al crear log", 500, "LOG_CREATE_ERROR")
        return res

    def listar_logs(self, limite: int = 100, desplazar: int = 0):
        return self.repo.listar_logs(limite, desplazar)

    def obtener_por_factura(self, factura_id: UUID):
        return self.repo.obtener_por_factura(factura_id)

    def listar_auditoria(self, filters: dict = None, limit: int = 100, offset: int = 0):
        return self.repo.listar_auditoria(filters, limit, offset)

    def exportar_auditoria(self, filters: dict = None):
        data = self.repo.obtener_auditoria_exportar(filters)
        
        headers = ["Fecha", "Módulo", "Actor", "Email", "Evento", "Detalle", "IP"]
        keys = ["created_at", "modulo", "actor_nombre", "actor_email", "evento", "motivo", "ip_address"]
        
        # Mapear datos y formatear fecha
        formatted_data = []
        for row in data:
            item = row.copy()
            if item.get('created_at'):
                if isinstance(item['created_at'], datetime):
                    item['created_at'] = item['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            formatted_data.append(item)
            
        return generate_excel_report("Reporte de Auditoria", headers, formatted_data, keys)

    def registrar_evento(self, user_id: UUID, evento: str, detail: str = None, ip: str = None, ua: str = None, origen: str = 'SISTEMA'):
        return self.repo.registrar_evento(user_id, evento, detail, ip, ua, origen)
