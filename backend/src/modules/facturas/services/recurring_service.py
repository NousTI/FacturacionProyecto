"""
Servicio para Facturación Programada (Recurrente).

Maneja la lógica de periodicidad y planificación de facturas automáticas.
"""

from uuid import UUID
from datetime import date, timedelta
from typing import List, Optional
from fastapi import Depends
from ..repository_programacion import RepositorioProgramacion
from ..schemas_programacion import (
    FacturacionProgramadaCreacion, 
    FacturacionProgramadaActualizacion
)
from src.errors.app_error import AppError

class ServicioRecurringBilling:
    def __init__(self, repo_prog: RepositorioProgramacion = Depends()):
        self.repo_prog = repo_prog

    def _calcular_proxima_emision(self, frecuencia: str, dia: int, base_date: date) -> date:
        """Calcula la siguiente fecha de emisión según la frecuencia."""
        if frecuencia == 'MENSUAL':
            # Siguiente mes
            if base_date.month == 12:
                next_month = date(base_date.year + 1, 1, dia)
            else:
                next_month = date(base_date.year, base_date.month + 1, dia)
            return next_month
        elif frecuencia == 'TRIMESTRAL':
            # +3 meses
            month = base_date.month + 3
            year = base_date.year
            while month > 12:
                month -= 12
                year += 1
            return date(year, month, dia)
        elif frecuencia == 'ANUAL':
            return date(base_date.year + 1, base_date.month, dia)
        return base_date

    def crear_programacion(self, datos: FacturacionProgramadaCreacion, usuario_actual: dict) -> dict:
        empresa_id = usuario_actual.get("empresa_id")
        usuario_id = usuario_actual.get("id")
        
        payload = datos.model_dump()
        payload['empresa_id'] = empresa_id
        payload['usuario_id'] = usuario_id
        
        # Fecha de inicio como primera emisión si es hoy o futuro
        if datos.fecha_inicio >= date.today():
            payload['proxima_emision'] = datos.fecha_inicio
        else:
            # Si la fecha de inicio es pasada, calcular la proxima basada en la frecuencia
            # Simplificación: usar hoy como referencia
            payload['proxima_emision'] = date.today()

        prog = self.repo_prog.crear(payload)
        if not prog:
            raise AppError("Error al crear la programación", 500)
        return prog

    def obtener_programacion(self, id: UUID, usuario_actual: dict) -> dict:
        prog = self.repo_prog.obtener_por_id(id)
        if not prog:
            raise AppError("Programación no encontrada", 404)
        
        # Validar empresa si no es superadmin
        if not usuario_actual.get("is_superadmin") and str(prog['empresa_id']) != str(usuario_actual.get("empresa_id")):
            raise AppError("No tiene permiso", 403)
            
        return prog

    def listar_programaciones(self, usuario_actual: dict, activo: Optional[bool] = None) -> List[dict]:
        empresa_id = usuario_actual.get("empresa_id")
        return self.repo_prog.listar(empresa_id=empresa_id, activo=activo)

    def actualizar_programacion(self, id: UUID, datos: FacturacionProgramadaActualizacion, usuario_actual: dict) -> dict:
        self.obtener_programacion(id, usuario_actual)
        res = self.repo_prog.actualizar(id, datos.model_dump(exclude_unset=True))
        if not res:
            raise AppError("Error al actualizar", 500)
        return res

    def eliminar_programacion(self, id: UUID, usuario_actual: dict) -> bool:
        self.obtener_programacion(id, usuario_actual)
        return self.repo_prog.eliminar(id)

    def registrar_ejecucion(self, id: UUID, exitosa: bool):
        """Actualiza estadísticas y proxima fecha tras un intento de emision."""
        prog = self.repo_prog.obtener_por_id(id)
        if not prog: return
        
        updates = {
            "total_emisiones": prog['total_emisiones'] + 1,
            "ultima_emision": date.today()
        }
        
        if exitosa:
            updates["emisiones_exitosas"] = prog['emisiones_exitosas'] + 1
            # Calcular proxima fecha
            updates["proxima_emision"] = self._calcular_proxima_emision(
                prog['tipo_frecuencia'], 
                prog['dia_emision'], 
                date.today()
            )
        else:
            updates["emisiones_fallidas"] = prog['emisiones_fallidas'] + 1
            
        self.repo_prog.actualizar(id, updates)
