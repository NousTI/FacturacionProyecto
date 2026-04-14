from fastapi import Depends
from typing import Optional
from datetime import datetime
from .repository import RepositorioR033

class ServicioR033:
    def __init__(self, repo: RepositorioR033 = Depends()):
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
        top_empresas = self.repo.obtener_top_empresas_usuarios(limit=5)

        now = datetime.now()

        # Formatear datos de empresas
        for e in empresas:
            u_acceso = e.get('ultimo_acceso')
            if u_acceso:
                if isinstance(u_acceso, str):
                    try:
                        u_acceso = datetime.fromisoformat(u_acceso)
                    except:
                        pass
                
                if isinstance(u_acceso, datetime):
                    # Normalizar a naive para evitar conflictos de zona horaria
                    if u_acceso.tzinfo:
                        u_acceso = u_acceso.replace(tzinfo=None)
                    
                    diff = (now - u_acceso).days
                    if diff == 0:
                        e['ultimo_acceso_fmt'] = "Hoy"
                    elif diff < 30:
                        e['ultimo_acceso_fmt'] = f"Hace {diff} días"
                    else:
                        e['ultimo_acceso_fmt'] = u_acceso.strftime('%Y-%m-%d')
                else:
                    e['ultimo_acceso_fmt'] = "Nunca"
            else:
                e['ultimo_acceso_fmt'] = "Nunca"

        return {
            # Resumen
            "promedio_usuarios": float(promedio_usuarios.get("promedio_usuarios", 0)),
            "max_usuarios": int(promedio_usuarios.get("max_usuarios", 0)),
            "min_usuarios": int(promedio_usuarios.get("min_usuarios", 0)),
            # Detalle
            "empresas": empresas,
            # Gráficas
            "modulos_mas_usados": modulos_mas_usados,
            "top_empresas_usuarios": top_empresas
        }
