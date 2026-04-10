from uuid import UUID
from typing import Dict, Any
from .repository import RepositorioR008
from fastapi import Depends

class ServicioR008:
    def __init__(self, repo: RepositorioR008 = Depends()):
        self.repo = repo

    def generar_reporte_cartera(self, empresa_id: UUID) -> Dict[str, Any]:
        """Genera el reporte de cuentas por cobrar completo."""
        kpis = self.repo.obtener_kpis_cartera(empresa_id)
        top_clientes = self.repo.obtener_top_clientes_pendientes(empresa_id)
        
        return {
            "kpis": kpis,
            "top_clientes": top_clientes,
            "grafica_morosidad": {
                "vencido_30": float(kpis['vencido_menor_30']),
                "critico_30": float(kpis['cartera_critica']),
                "porcentaje_morosidad": kpis['indice_morosidad']
            }
        }
