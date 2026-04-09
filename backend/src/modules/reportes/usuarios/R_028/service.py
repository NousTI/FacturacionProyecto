from uuid import UUID
from typing import Dict, Any
from datetime import datetime, timedelta
from .repository import RepositorioR028
from fastapi import Depends

class ServicioR028:
    def __init__(self, repo: RepositorioR028 = Depends()):
        self.repo = repo

    def generar_resumen_ejecutivo(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Consolida KPIs principales y calcula variaciones."""
        
        # 1. KPIs Periodo Actual
        ventas_actual = self.repo.obtener_kpis_ventas(empresa_id, fecha_inicio, fecha_fin)
        cobros_actual = self.repo.obtener_kpis_cobros(empresa_id, fecha_inicio, fecha_fin)
        
        # 2. Calcular Periodo Anterior (para variaciones)
        d1 = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        d2 = datetime.strptime(fecha_fin, '%Y-%m-%d')
        delta = (d2 - d1).days + 1
        prev_inicio = (d1 - timedelta(days=delta)).strftime('%Y-%m-%d')
        prev_fin = (d1 - timedelta(days=1)).strftime('%Y-%m-%d')
        
        ventas_prev = self.repo.obtener_kpis_ventas(empresa_id, prev_inicio, prev_fin)
        
        # 3. Cálculos de Variación
        def calcular_variacion(actual, anterior):
            if anterior == 0: return 100.0 if actual > 0 else 0.0
            return round(((actual - anterior) / anterior) * 100, 2)

        total_actual = float(ventas_actual['total_facturado'])
        total_prev = float(ventas_prev['total_facturado'])
        variacion_ventas = calcular_variacion(total_actual, total_prev)
        
        facturas_actual = int(ventas_actual['facturas_emitidas'])
        facturas_prev = int(ventas_prev['facturas_emitidas'])
        variacion_facturas = calcular_variacion(facturas_actual, facturas_prev)
        
        ticket_actual = total_actual / facturas_actual if facturas_actual > 0 else 0
        ticket_prev = total_prev / facturas_prev if facturas_prev > 0 else 0
        variacion_ticket = calcular_variacion(ticket_actual, ticket_prev)
        
        # 4. Formateo Final
        return {
            "periodo": {"inicio": fecha_inicio, "fin": fecha_fin},
            "ventas": {
                "total_facturado": total_actual,
                "variacion_porcentual": variacion_ventas,
                "facturas_emitidas": facturas_actual,
                "variacion_facturas": variacion_facturas,
                "ticket_promedio": round(ticket_actual, 2),
                "variacion_ticket": variacion_ticket,
                "clientes_activos": ventas_actual['clientes_activos']
            },
            "cobros": {
                "total_cobrado": cobros_actual['total_cobrado'],
                "pendiente_cobro": cobros_actual['total_pendiente'],
                "porcentaje_recuperacion": round((cobros_actual['total_cobrado'] / total_actual * 100), 2) if total_actual > 0 else 0.0
            },
            "gastos": {
                "nota": "Módulo de Gastos no configurado",
                "total_gastos": 0.0,
                "nomina": 0.0,
                "operativos": 0.0
            },
            "utilidad": {
                "utilidad_bruta": 0.0, # Se podría inyectar el servicio R-026 aquí si se desea
                "margen_bruto": 0.0,
                "utilidad_neta": 0.0
            }
        }
