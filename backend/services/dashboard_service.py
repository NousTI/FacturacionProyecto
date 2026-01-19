from fastapi import Depends
from repositories.dashboard_repository import DashboardRepository
from typing import Dict, Any

class DashboardService:
    def __init__(self, repo: DashboardRepository = Depends()):
        self.repo = repo

    def get_summary(self) -> Dict[str, Any]:
        stats = self.repo.get_general_stats()
        
        # Calculate percentages or add placeholders
        # "Errores SRI" -> "En PROCESO"
        # "Certificados por vender" -> "En PROCESO"
        
        formatted_stats = {
            "total_empresas": stats.get('total_empresas', 0),
            "empresas_activas": stats.get('empresas_activas', 0),
            "empresas_inactivas": stats.get('total_empresas', 0) - stats.get('empresas_activas', 0),
            
            "total_usuarios": stats.get('total_usuarios', 0),
            
            # User requested "En PROCESO" placeholder
            "total_facturas": "En PROCESO", 
            
            "ingresos_totales": stats.get('total_ingresos', 0.0),
            
            "comisiones_pendientes_monto": stats.get('comisiones_pendientes_monto', 0.0),
            "comisiones_pendientes_count": stats.get('comisiones_pendientes_count', 0),
            
            # Placeholders as requested
            "errores_sri_msg": "En PROCESO",
            "certificados_msg": "En PROCESO",
            
            # Additional trend placeholders if UI needs them
            "trend_empresas": "+0%", 
            "trend_usuarios": "+0%",
            "trend_facturas": "+0%",
            "trend_ingresos": "+0%"
        }
        
        return formatted_stats

    def get_charts(self) -> Dict[str, Any]:
        # Monthly Invoices
        invoices_data = self.repo.get_monthly_invoices()
        
        # SaaS Revenue
        revenue_data = self.repo.get_monthly_revenue()
        
        # Companies by Plan
        plan_data = self.repo.get_companies_by_plan()
        
        # Calculate percentages for plan
        total_in_plans = sum(item['count'] for item in plan_data)
        formatted_plan_data = []
        
        colors = [
            'linear-gradient(90deg, #4f46e5, #6366f1)', 
            'linear-gradient(90deg, #10b981, #34d399)', 
            'linear-gradient(90deg, #f59e0b, #fbbf24)',
            'linear-gradient(90deg, #ef4444, #f87171)'
        ]
        
        for index, item in enumerate(plan_data):
            percent = round((item['count'] / total_in_plans * 100), 1) if total_in_plans > 0 else 0
            formatted_plan_data.append({
                "name": item['name'],
                "count": item['count'],
                "percent": percent,
                "color": colors[index % len(colors)]
            })
            
        # SRI Errors Trend (Mock for now as requested "Errores SRI eso esta en proceso")
        # Returning dummy trend data for the sparkly chart
        sri_trend = [10, 15, 8, 12, 5, 20, 15, 10, 5, 8, 3, 2] 

        return {
            "facturas_mes": invoices_data,
            "ingresos_saas": revenue_data,
            "empresas_by_plan": formatted_plan_data,
            "sri_trend": sri_trend
        }
