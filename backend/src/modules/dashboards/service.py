from fastapi import Depends
from typing import Dict, Any
from .repository import RepositorioDashboards
from .schemas import DashboardKPIs, DashboardAlertas, DashboardOverview, DashboardAlerta

class ServicioDashboards:
    def __init__(self, repo: RepositorioDashboards = Depends()):
        self.repo = repo

    def obtener_kpis(self) -> DashboardKPIs:
        base_kpis = self.repo.obtener_kpis_principales()
        variacion = self.repo.obtener_variacion_ingresos()
        pagos_atrasados = self.repo.obtener_pagos_atrasados()
        
        return DashboardKPIs(
            empresas_activas=base_kpis['empresas_activas'],
            ingresos_mensuales=base_kpis['ingresos_mensuales'],
            comisiones_pendientes=base_kpis['comisiones_pendientes'],
            pagos_atrasados=pagos_atrasados,
            empresas_por_vencer=base_kpis.get('empresas_por_vencer', 0),
            variacion_ingresos=round(variacion, 2)
        )

    def obtener_alertas(self) -> DashboardAlertas:
        raw_alerts = self.repo.obtener_alertas_sistema()
        
        return DashboardAlertas(
            criticas=[DashboardAlerta(**a) for a in raw_alerts['criticas']],
            advertencias=[DashboardAlerta(**a) for a in raw_alerts['advertencias']],
            informativas=[DashboardAlerta(**a) for a in raw_alerts['informativas']]
        )

    def obtener_overview(self) -> DashboardOverview:
        return DashboardOverview(
            kpis=self.obtener_kpis(),
            alertas=self.obtener_alertas()
        )

    def obtener_resumen(self) -> Dict[str, Any]:
        """
        Retorna el formato antiguo para compatibilidad (/dashboard/summary).
        Orquesta los nuevos métodos internamente donde es posible, 
        pero mantiene la estructura de respuesta exacta.
        """
        stats = self.repo.obtener_estadisticas_generales()
        
        return {
            "total_empresas": stats['total_empresas'],
            "empresas_activas": stats['empresas_activas'],
            "empresas_inactivas": stats['total_empresas'] - stats['empresas_activas'],
            "total_usuarios": stats['total_usuarios'],
            "total_facturas": "En PROCESO", 
            "ingresos_totales": stats['total_ingresos'],
            "comisiones_pendientes_monto": stats['comisiones_pendientes_monto'],
            "comisiones_pendientes_count": stats['comisiones_pendientes_count'],
            "errores_sri_msg": "En PROCESO",
            "certificados_msg": "En PROCESO"
        }

    def obtener_graficos(self) -> Dict[str, Any]:
        plan_data = self.repo.obtener_empresas_por_plan()
        total = sum(item['count'] for item in plan_data)
        
        formatted_plans = []
        colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444']
        
        for i, item in enumerate(plan_data):
            formatted_plans.append({
                "name": item['name'],
                "count": item['count'],
                "percent": round((item['count'] / total * 100), 1) if total > 0 else 0,
                "color": colors[i % len(colors)]
            })
            
        return {
            "facturas_mes": self.repo.obtener_facturas_mensuales(),
            "ingresos_saas": self.repo.obtener_ingresos_mensuales(),
            "empresas_by_plan": formatted_plans,
            "sri_trend": [10, 15, 8, 12, 5, 20, 15, 10, 5, 8, 3, 2] 
        }
