from fastapi import Depends
from typing import Dict, Any
from .repository import RepositorioDashboards
from .schemas import DashboardKPIs, DashboardAlertas, DashboardOverview, DashboardAlerta

from ...constants.enums import AuthKeys

class ServicioDashboards:
    def __init__(self, repo: RepositorioDashboards = Depends()):
        self.repo = repo

    def _get_ids(self, usuario: dict):
        vendedor_id = usuario.get('id') if usuario.get(AuthKeys.IS_VENDEDOR) else None
        empresa_id = usuario.get('empresa_id') if usuario.get(AuthKeys.IS_USUARIO) else None
        return vendedor_id, empresa_id

    def obtener_kpis(self, usuario: dict) -> DashboardKPIs:
        v_id, e_id = self._get_ids(usuario)
        base_kpis = self.repo.obtener_kpis_principales(vendedor_id=v_id, empresa_id=e_id)
        
        # Variación solo para superadmin/vendedor (SaaS context)
        variacion = 0
        if not e_id:
            variacion = self.repo.obtener_variacion_ingresos()
            
        return DashboardKPIs(**base_kpis, variacion_ingresos=round(variacion, 2))

    def obtener_alertas(self, usuario: dict) -> DashboardAlertas:
        v_id, e_id = self._get_ids(usuario)
        raw_alerts = self.repo.obtener_alertas_sistema(vendedor_id=v_id, empresa_id=e_id)
        
        return DashboardAlertas(
            criticas=[DashboardAlerta(**a) for a in raw_alerts['criticas']],
            advertencias=[DashboardAlerta(**a) for a in raw_alerts['advertencias']],
            informativas=[DashboardAlerta(**a) for a in raw_alerts['informativas']]
        )

    def obtener_overview(self, usuario: dict) -> DashboardOverview:
        return DashboardOverview(
            kpis=self.obtener_kpis(usuario),
            alertas=self.obtener_alertas(usuario)
        )

    def obtener_resumen(self, usuario: dict) -> Dict[str, Any]:
        """Solo para Superadmin (Compatibilidad)"""
        if not usuario.get(AuthKeys.IS_SUPERADMIN):
            return {}
            
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

    def obtener_graficos(self, usuario: dict) -> Dict[str, Any]:
        v_id, e_id = self._get_ids(usuario)
        
        res = {
            "facturas_mes": self.repo.obtener_facturas_mensuales(empresa_id=e_id),
            "ingresos_saas": self.repo.obtener_ingresos_mensuales(vendedor_id=v_id),
            "empresas_by_plan": [],
            "sri_trend": [0] * 12
        }
        
        if not e_id:
             plan_data = self.repo.obtener_empresas_por_plan()
             total = sum(item['count'] for item in plan_data)
             colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444']
             
             for i, item in enumerate(plan_data):
                 res["empresas_by_plan"].append({
                     "name": item['name'],
                     "count": item['count'],
                     "percent": round((item['count'] / total * 100), 1) if total > 0 else 0,
                     "color": colors[i % len(colors)]
                 })
        
        return res
