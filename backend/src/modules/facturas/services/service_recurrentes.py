from uuid import UUID
from typing import List, Optional, Any
from fastapi import Depends

from . import ServicioRecurringBilling
from ..schemas_programacion import (
    FacturacionProgramadaCreacion,
    FacturacionProgramadaActualizacion
)

class ServicioRecurrentes:
    def __init__(
        self,
        recurrentes: ServicioRecurringBilling = Depends()
    ):
        self.recurrentes = recurrentes

    def crear_programacion(self, datos: FacturacionProgramadaCreacion, usuario_actual: dict):
        return self.recurrentes.crear_programacion(datos, usuario_actual)

    def crear_programacion_unificada(self, datos: Any, usuario_actual: dict):
        return self.recurrentes.crear_programacion_unificada(datos, usuario_actual)

    def listar_programaciones(self, usuario_actual: dict, activo: Optional[bool] = None):
        return self.recurrentes.listar_programaciones(usuario_actual, activo)

    def obtener_programacion(self, id: UUID, usuario_actual: dict):
        return self.recurrentes.obtener_programacion(id, usuario_actual)

    def actualizar_programacion(self, id: UUID, datos: FacturacionProgramadaActualizacion, usuario_actual: dict):
        return self.recurrentes.actualizar_programacion(id, datos, usuario_actual)

    def eliminar_programacion(self, id: UUID, usuario_actual: dict):
        return self.recurrentes.eliminar_programacion(id, usuario_actual)

    def obtener_historial(self, id: UUID, usuario_actual: dict, limit: int = 50, offset: int = 0) -> List[dict]:
        return self.recurrentes.obtener_historial(id, usuario_actual, limit=limit, offset=offset)

    def obtener_id_plantilla(self, id: UUID, usuario_actual: dict) -> Any:
        return self.recurrentes.obtener_id_plantilla(id, usuario_actual)
