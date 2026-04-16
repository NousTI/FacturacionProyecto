from typing import Optional
from .repository import RepositorioR031

class ServicioR031:
    def __init__(self, repo: RepositorioR031):
        self.repo = repo

    def obtener_r_031_reporte_global(
        self,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None
    ) -> dict:
        """
        Obtiene el reporte global R-031 con todos los KPIs, zonas y gráficas.
        """
        kpis = self.repo.obtener_kpis_globales(fecha_inicio, fecha_fin)
        empresas_rescate = self.repo.obtener_zona_rescate(fecha_inicio, fecha_fin)
        planes_mas_vendidos = self.repo.obtener_planes_mas_vendidos(fecha_inicio, fecha_fin)
        top_vendedores = self.repo.obtener_top_vendedores(fecha_inicio, fecha_fin)

        empresas_upgrade = self.repo.obtener_zona_upgrade(fecha_inicio, fecha_fin)

        return {
            # KPIs
            "empresas_activas": int(kpis.get("empresas_activas", 0)),
            "variacion_empresas_activas_valor": int(kpis.get("variacion_empresas_activas_valor", 0)),
            "ingresos_anio": float(kpis.get("ingresos_anio", 0)),
            "variacion_ingresos_anio": float(kpis.get("variacion_ingresos_anio", 0)),
            "ingresos_mes": float(kpis.get("ingresos_mes", 0)),
            "variacion_ingresos_mes": float(kpis.get("variacion_ingresos_mes", 0)),
            "usuarios_nuevos_mes": int(kpis.get("usuarios_nuevos_mes", 0)),
            "variacion_usuarios_nuevos": int(kpis.get("variacion_usuarios_nuevos", 0)),
            "crecimiento_neto": int(kpis.get("crecimiento_neto", 0)),
            "tasa_crecimiento": float(kpis.get("tasa_crecimiento", 0)),
            "tasa_abandono": float(kpis.get("tasa_abandono", 0)),
            "zona_rescate": int(kpis.get("zona_rescate", 0)),
            "zona_upgrade": int(kpis.get("zona_upgrade", 0)),

            # Tablas
            "empresas_rescate": empresas_rescate,
            "empresas_upgrade": empresas_upgrade,
            "planes_mas_vendidos": planes_mas_vendidos,
            "top_vendedores": top_vendedores
        }
