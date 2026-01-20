from fastapi import Depends
from typing import Dict, Any
from .repository import RepositorioDashboards

class ServicioDashboards:
    def __init__(self, repo: RepositorioDashboards = Depends()):
        self.repo = repo

    def obtener_resumen(self) -> Dict[str, Any]:
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
