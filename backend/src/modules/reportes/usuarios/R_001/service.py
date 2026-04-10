from uuid import UUID
from typing import Dict, Any, Optional
from .repository import RepositorioR001
from fastapi import Depends
from datetime import datetime, timedelta

class ServicioR001:
    def __init__(self, repo: RepositorioR001 = Depends()):
        self.repo = repo

    def generar_reporte_ventas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """
        Genera el reporte de ventas generales (R-001) con:
        - KPIs: facturas, subtotales, IVA desglosado
        - Detalle por usuario
        - Gráfica de top usuarios
        """
        # Obtener datos actuales
        kpis = self.repo.obtener_kpis_ventas(empresa_id, fecha_inicio, fecha_fin)
        iva_desglosado = self.repo.obtener_iva_desglosado(empresa_id, fecha_inicio, fecha_fin)
        ventas_por_usuario = self.repo.obtener_ventas_por_usuario(empresa_id, fecha_inicio, fecha_fin)
        top_usuarios = self.repo.obtener_top_usuarios_ventas(empresa_id, fecha_inicio, fecha_fin)
        ticket_promedio = self.repo.obtener_ticket_promedio(empresa_id, fecha_inicio, fecha_fin)

        # Calcular período anterior para variaciones
        d1 = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        d2 = datetime.strptime(fecha_fin, '%Y-%m-%d')
        delta = (d2 - d1).days + 1
        prev_inicio = (d1 - timedelta(days=delta)).strftime('%Y-%m-%d')
        prev_fin = (d1 - timedelta(days=1)).strftime('%Y-%m-%d')

        kpis_prev = self.repo.obtener_kpis_ventas(empresa_id, prev_inicio, prev_fin)
        ticket_promedio_prev = self.repo.obtener_ticket_promedio(empresa_id, prev_inicio, prev_fin)

        # Función auxiliar para calcular variaciones
        def calc_variacion(actual: float, anterior: float) -> float:
            actual, anterior = float(actual), float(anterior)
            if anterior == 0:
                return 100.0 if actual > 0 else 0.0
            return round(((actual - anterior) / anterior) * 100, 1)

        return {
            # KPIs principales
            "facturas_emitidas": {
                "valor": int(kpis.get("facturas_validas", 0)),
                "variacion": calc_variacion(
                    kpis.get("facturas_validas", 0),
                    kpis_prev.get("facturas_validas", 0)
                )
            },
            "subtotal_sin_iva": float(kpis.get("subtotal_sin_iva", 0)),
            # IVA desglosado por tarifa
            "iva_desglosado": [
                {
                    "tarifa": item["tarifa"],
                    "iva_cobrado": float(item["iva_cobrado"]),
                    "base_imponible": float(item["base_imponible"])
                }
                for item in iva_desglosado
            ],
            "ticket_promedio": {
                "valor": float(ticket_promedio.get("ticket_promedio_actual", 0)),
                "variacion": calc_variacion(
                    ticket_promedio.get("ticket_promedio_actual", 0),
                    ticket_promedio_prev.get("ticket_promedio_actual", 0)
                )
            },
            # Detalle por usuario
            "ventas_por_usuario": [
                {
                    "usuario": item["usuario"],
                    "facturas": int(item["facturas_totales"]),
                    "total_ventas": float(item["total_ventas"]),
                    "ticket_promedio": float(item["ticket_promedio"]),
                    "anuladas": int(item["anuladas"]),
                    "devoluciones": int(item["devoluciones"])
                }
                for item in ventas_por_usuario
            ],
            # Gráfica de top usuarios
            "top_usuarios": [
                {
                    "usuario": item["usuario"],
                    "total_ventas": float(item["total_ventas"]),
                    "facturas": int(item["facturas_validas"])
                }
                for item in top_usuarios
            ]
        }
