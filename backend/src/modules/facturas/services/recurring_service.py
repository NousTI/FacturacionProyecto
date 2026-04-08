import logging
import calendar
from uuid import UUID
from datetime import date, datetime
from typing import List, Optional
from fastapi import Depends

from ..repository_programacion import RepositorioProgramacion
from ..schemas_programacion import (
    FacturacionProgramadaCreacion, 
    FacturacionProgramadaActualizacion
)
from ..schemas import FacturaCreacion
from .service_factura import ServicioFactura
from ...establecimientos.repository import RepositorioPuntosEmision
from ....constants.enums import AuthKeys
from ....errors.app_error import AppError

logger = logging.getLogger("facturacion_api")

class ServicioRecurringBilling:
    def __init__(
        self, 
        repo_prog: RepositorioProgramacion = Depends(),
        service_factura: ServicioFactura = Depends(),
        repo_pe: RepositorioPuntosEmision = Depends()
    ):
        self.repo_prog = repo_prog
        self.service_factura = service_factura
        self.repo_pe = repo_pe

    def _calcular_proxima_emision(self, frecuencia: str, dia: int, base_date: date) -> date:
        """Calcula la siguiente fecha de emisión según la frecuencia, manejando fin de mes."""
        month = base_date.month
        year = base_date.year
        
        if frecuencia == 'MENSUAL':
            month += 1
        elif frecuencia == 'TRIMESTRAL':
            month += 3
        elif frecuencia == 'ANUAL':
            year += 1
            
        while month > 12:
            month -= 12
            year += 1
            
        # Asegurar que el día sea válido para el mes (ej. 31 de feb -> 28 de feb)
        last_day = calendar.monthrange(year, month)[1]
        actual_day = min(dia, last_day)
        
        return date(year, month, actual_day)

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
            payload['proxima_emision'] = date.today()

        prog = self.repo_prog.crear(payload)
        if not prog:
            raise AppError("Error al crear la programación", 500)
        return prog

    def obtener_programacion(self, id: UUID, usuario_actual: dict) -> dict:
        prog = self.repo_prog.obtener_por_id(id)
        if not prog:
            raise AppError("Programación no encontrada", 404)
        
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN) and str(prog['empresa_id']) != str(usuario_actual.get("empresa_id")):
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

    def procesar_emisiones_automaticas(self):
        """Busca programaciones vencidas y las emite masivamente."""
        pendientes = self.repo_prog.obtener_pendientes_emision()
        if not pendientes:
            return {"procesadas": 0, "exitosas": 0, "fallidas": 0}
            
        logger.info(f"FACTURACION_RECURRENTE: Procesando {len(pendientes)} registros...")
        result = {"procesadas": len(pendientes), "exitosas": 0, "fallidas": 0}
        
        for prog in pendientes:
            try:
                # 1. Preparar Contexto Simulado para el servicio facturas
                usuario_context = {
                    "id": str(prog['usuario_id']),
                    "empresa_id": str(prog['empresa_id']),
                    AuthKeys.IS_SUPERADMIN: False,
                    "permisos": []
                }

                # 2. Buscar Punto de Emisión (usar el primero por defecto si no hay config)
                puntos = self.repo_pe.listar(empresa_id=prog['empresa_id'])
                if not puntos:
                    raise Exception("No hay puntos de emisión configurados para esta empresa")
                
                punto = puntos[0]

                # 3. Preparar Datos de Factura
                subtotal = float(prog['monto'])
                iva = round(subtotal * 0.15, 2) # Asumir 15% por defecto? Debería ser parametrizado
                total = round(subtotal + iva, 2)

                datos_factura = FacturaCreacion(
                    establecimiento_id=punto['establecimiento_id'],
                    punto_emision_id=punto['id'],
                    cliente_id=prog['cliente_id'],
                    facturacion_programada_id=prog['id'],
                    fecha_emision=datetime.now(),
                    subtotal_sin_iva=subtotal,
                    subtotal_con_iva=0,
                    iva=iva,
                    total=total,
                    detalles=[{
                        "nombre": prog['concepto'],
                        "cantidad": 1,
                        "precio_unitario": subtotal,
                        "tipo_iva": "4", # Código SRI para 15%
                        "subtotal": subtotal,
                        "valor_iva": iva
                    }],
                    origen="FACTURACION_PROGRAMADA",
                    observaciones=f"Generada automáticamente por programación: {prog['id']}"
                )

                # 4. Emitir Factura
                self.service_factura.crear_factura(datos_factura, usuario_context)
                
                # 5. Marcar éxito
                self.registrar_ejecucion(prog['id'], exitosa=True, frecuencia=prog['tipo_frecuencia'], dia=prog['dia_emision'])
                result["exitosas"] += 1
                
            except Exception as e:
                logger.error(f"Error procesando programacion {prog['id']}: {str(e)}")
                self.registrar_ejecucion(prog['id'], exitosa=False)
                result["fallidas"] += 1
                
        return result

    def registrar_ejecucion(self, id: UUID, exitosa: bool, frecuencia: str = None, dia: int = None):
        """Actualiza estadísticas y proxima fecha tras un intento de emision."""
        prog = self.repo_prog.obtener_por_id(id)
        if not prog: return
        
        updates = {
            "total_emisiones": prog['total_emisiones'] + 1,
            "ultima_emision": date.today()
        }
        
        if exitosa:
            updates["emisiones_exitosas"] = prog['emisiones_exitosas'] + 1
            # Recalcular proxima fecha si se proporcionan los datos
            if frecuencia and dia:
                updates["proxima_emision"] = self._calcular_proxima_emision(frecuencia, dia, date.today())
        else:
            updates["emisiones_fallidas"] = prog['emisiones_fallidas'] + 1
            
        self.repo_prog.actualizar(id, updates)
