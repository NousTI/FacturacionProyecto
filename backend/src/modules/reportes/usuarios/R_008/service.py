from uuid import UUID
from typing import Dict, Any, Optional
from .repository import RepositorioR008
from fastapi import Depends

class ServicioR008:
    def __init__(self, repo: RepositorioR008 = Depends()):
        self.repo = repo

    def generar_reporte_cartera(self, empresa_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> Dict[str, Any]:
        """Genera el reporte de cuentas por cobrar completo con filtro de fechas."""
        kpis = self.repo.obtener_kpis_cartera(empresa_id, fecha_inicio, fecha_fin)
        top_clientes = self.repo.obtener_top_clientes_pendientes(empresa_id, fecha_inicio, fecha_fin)
        
        return {
            "kpis": {
                "total_por_cobrar": float(kpis['total_por_cobrar']),
                "vencido_menor_30": float(kpis['vencido_menor_30']),
                "cartera_critica": float(kpis['cartera_critica']),
                "indice_morosidad": float(kpis['indice_morosidad']),
            },
            "top_clientes": [
                {
                    **row,
                    "saldo_total": float(row["saldo_total"]),
                    "dias_vencido": int(row["dias_vencido"]) if row["dias_vencido"] is not None else 0,
                }
                for row in top_clientes
            ],
            "grafica_morosidad": {
                "labels": ["Vencido <30 días", "Cartera crítica >30 días"],
                "valores": [float(kpis['vencido_menor_30']), float(kpis['cartera_critica'])],
                "porcentaje_morosidad": float(kpis['indice_morosidad'])
            }
        }
