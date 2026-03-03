from uuid import UUID
from typing import Optional
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

    def obtener_programacion(self, id: UUID, usuario_actual: dict):
        return self.recurrentes.obtener_programacion(id, usuario_actual)

    def listar_programaciones(self, usuario_actual: dict, activo: Optional[bool] = None):
        return self.recurrentes.listar_programaciones(usuario_actual, activo)

    def actualizar_programacion(self, id: UUID, datos: FacturacionProgramadaActualizacion, usuario_actual: dict):
        return self.recurrentes.actualizar_programacion(id, datos, usuario_actual)

    def eliminar_programacion(self, id: UUID, usuario_actual: dict):
        return self.recurrentes.eliminar_programacion(id, usuario_actual)
