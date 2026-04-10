from typing import Optional
from .repository import RepositorioR032

class ServicioR032:
    def __init__(self, repo: RepositorioR032):
        self.repo = repo

    def obtener_reporte_comisiones(
        self,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None,
        vendedor_id: Optional[str] = None,
        estado: Optional[str] = None
    ) -> dict:
        """
        Obtiene el reporte de comisiones R-032 con KPIs, detalle y gráficas.
        """
        kpis = self.repo.obtener_kpis_comisiones_superadmin(
            fecha_inicio, fecha_fin, vendedor_id, estado
        )
        detalle = self.repo.obtener_detalle_comisiones_superadmin(
            vendedor_id, estado, fecha_inicio, fecha_fin
        )
        # Obtener datos para gráficas (desde R-031 repository)
        from ..R_031.repository import RepositorioR031
        repo_r031 = RepositorioR031()
        planes_mas_vendidos = repo_r031.obtener_planes_mas_vendidos(fecha_inicio, fecha_fin, vendedor_id)
        top_vendedores = repo_r031.obtener_top_vendedores(fecha_inicio, fecha_fin, vendedor_id)

        return {
            # KPIs
            "kpis": {
                "comisiones_pendientes": float(kpis.get("comisiones_pendientes", 0)),
                "pagadas_mes": float(kpis.get("pagadas_mes", 0)),
                "vendedores_activos": int(kpis.get("vendedores_activos", 0)),
                "porcentaje_upgrades": float(kpis.get("porcentaje_upgrades", 0)),
                "porcentaje_clientes_perdidos": float(kpis.get("porcentaje_clientes_perdidos", 0))
            },
            # Detalle
            "detalle": detalle,
            # Gráficas
            "planes_mas_vendidos": planes_mas_vendidos,
            "top_vendedores": top_vendedores
        }
