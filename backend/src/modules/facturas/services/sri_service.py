"""
Servicio especializado en procesos del SRI para Facturas.

Maneja:
- Registro de intentos de emisión (logs)
- Registro de autorizaciones finales
- Comunicación con el módulo SRI core
"""

from uuid import UUID
from typing import Optional, List
from fastapi import Depends
from ..repository import RepositorioFacturas
from ..schemas_logs import (
    LogEmisionCreacion, 
    AutorizacionSRICreacion
)
from src.errors.app_error import AppError
from ...sri.service import ServicioSRI

class ServicioSRIFacturas:
    def __init__(
        self, 
        repo: RepositorioFacturas = Depends(),
        sri_core: ServicioSRI = Depends()
    ):
        self.repo = repo
        self.sri_core = sri_core

    def registrar_intento_emision(self, datos: LogEmisionCreacion) -> dict:
        """Registra un intento de envío al SRI en la tabla log_emision_facturas."""
        log = self.repo.crear_log_emision(datos.model_dump())
        if not log:
            raise AppError("Error al registrar intento de emisión", 500, "DB_ERROR")
        return log

    def registrar_autorizacion_final(self, datos: AutorizacionSRICreacion) -> dict:
        """
        Registra la autorización exitosa del SRI.
        Esta es la 'verdad' técnica final de una factura emitida.
        """
        autorizacion = self.repo.crear_autorizacion(datos.model_dump())
        if not autorizacion:
            raise AppError("Error al registrar autorización del SRI", 500, "DB_ERROR")
        
        # Al registrar autorizacion, debemos actualizar la factura principal
        # Esto usualmente se orquestará desde el servicio principal o aquí
        return autorizacion

    def obtener_historial_emision(self, factura_id: UUID) -> List[dict]:
        """Obtiene todos los intentos de emisión realizados para una factura."""
        return self.repo.listar_logs_emision(factura_id)

    def obtener_autorizacion(self, factura_id: UUID) -> Optional[dict]:
        """Obtiene la autorización oficial si existe."""
        return self.repo.obtener_autorizacion(factura_id)

    def emitir_factura(self, factura_id: UUID, usuario_actual: dict):
        """
        Inicia el proceso real de generación, firma y envío al SRI.
        Delega en el ServicioSRI (módulo core).
        """
        return self.sri_core.enviar_factura(factura_id, usuario_actual)
