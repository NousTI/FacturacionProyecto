from typing import Optional
from .repository import RepositorioR033

class ServicioR033:
    def __init__(self, repo: RepositorioR033):
        self.repo = repo

    def obtener_reporte_uso_sistema(
        self,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None
    ) -> dict:
        """
        Obtiene el reporte de uso del sistema R-033 con métricas de adopción,
        detalle de empresas y distribución de módulos.
        """
        empresas = self.repo.obtener_uso_sistema_por_empresa(fecha_inicio, fecha_fin)
        modulos_mas_usados = self.repo.obtener_modulos_mas_usados(fecha_inicio, fecha_fin)
        promedio_usuarios = self.repo.obtener_promedio_usuarios_por_empresa(fecha_inicio, fecha_fin)

        return {
            # Resumen
            "promedio_usuarios": float(promedio_usuarios.get("promedio_usuarios", 0)),
            "max_usuarios": int(promedio_usuarios.get("max_usuarios", 0)),
            # Detalle
            "empresas": empresas,
            # Gráficas
            "modulos_mas_usados": modulos_mas_usados
        }
