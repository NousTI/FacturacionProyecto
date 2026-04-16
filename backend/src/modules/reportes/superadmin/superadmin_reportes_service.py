from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from datetime import datetime

from .R_031.repository import RepositorioR031
from .R_032.repository import RepositorioR032
from .R_033.service import ServicioR033

class SuperAdminReportesService:
    def __init__(
        self,
        repo_r031: RepositorioR031 = Depends(),
        repo_r032: RepositorioR032 = Depends(),
        svc_r033: ServicioR033 = Depends()
    ):
        self.repo_r031 = repo_r031  
        self.repo_r032 = repo_r032
        self.svc_r033 = svc_r033

    def obtener_r_031_reporte_global(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None):
        kpis = self.repo_r031.obtener_kpis_globales(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        rescate_raw = self.repo_r031.obtener_zona_rescate(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        planes = self.repo_r031.obtener_planes_mas_vendidos(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        top_vendedores = self.repo_r031.obtener_top_vendedores(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)

        now = datetime.now()
        empresas_rescate = []

        for e in rescate_raw:
            # 1. Formatear Último Acceso
            u_acceso = e.get('ultimo_acceso')
            if u_acceso:
                # Normalizar a naive
                if hasattr(u_acceso, 'tzinfo') and u_acceso.tzinfo:
                    u_acceso = u_acceso.replace(tzinfo=None)
                
                diff_acceso = (now - u_acceso).days
                if diff_acceso > 30:
                    e['ultimo_acceso_fmt'] = u_acceso.strftime('%Y-%m-%d')
                else:
                    e['ultimo_acceso_fmt'] = f"Hace {diff_acceso} días" if diff_acceso > 0 else "Hoy"
            else:
                e['ultimo_acceso_fmt'] = "Nunca"

            # 2. Formatear Deadline
            deadline = e.get('deadline')
            if deadline:
                if isinstance(deadline, datetime):
                    deadline_date = deadline.date()
                else:
                    deadline_date = deadline

                diff_deadline = (deadline_date - now.date()).days
                if diff_deadline < 31:
                    if diff_deadline < 0:
                        e['deadline_fmt'] = "Vencido"
                    elif diff_deadline == 0:
                        e['deadline_fmt'] = "Hoy"
                    else:
                        e['deadline_fmt'] = f"{diff_deadline} días"
                else:
                    e['deadline_fmt'] = deadline_date.strftime('%Y-%m-%d')

            # 3. Calcular Antigüedad
            f_registro = e.get('fecha_registro')
            if f_registro:
                if isinstance(f_registro, datetime):
                    f_reg_date = f_registro.date()
                else:
                    f_reg_date = f_registro

                diff_ant = now.date() - f_reg_date
                años = diff_ant.days // 365
                meses = (diff_ant.days % 365) // 30
                if años > 0:
                    e['antiguedad'] = f"{años} año{'s' if años > 1 else ''}, {meses} mes{'es' if meses != 1 else ''}"
                elif meses > 0:
                    e['antiguedad'] = f"{meses} mes{'es' if meses > 1 else ''}"
                else:
                    e['antiguedad'] = f"{diff_ant.days} día{'s' if diff_ant.days != 1 else ''}"
            else:
                e['antiguedad'] = "Desconocida"

            empresas_rescate.append(e)

        empresas_upgrade = self.repo_r031.obtener_zona_upgrade(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)

        variacion_empresas = int(kpis.get("variacion_empresas_activas_valor", 0))

        return {
            **kpis,
            "crecimiento_neto": variacion_empresas,
            "empresas_rescate": empresas_rescate,
            "empresas_upgrade": empresas_upgrade,
            "planes_mas_vendidos": planes,
            "top_vendedores": top_vendedores,
        }

    def obtener_reporte_comisiones_superadmin(self, vendedor_id=None, estado=None, fecha_inicio=None, fecha_fin=None):
        kpis = self.repo_r032.obtener_kpis_comisiones_superadmin(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, vendedor_id=vendedor_id, estado=estado)
        detalle = self.repo_r032.obtener_detalle_comisiones_superadmin(vendedor_id, estado, fecha_inicio, fecha_fin)
        top_vendedores = self.repo_r031.obtener_top_vendedores(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, vendedor_id=vendedor_id)
        planes = self.repo_r031.obtener_planes_mas_vendidos(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, vendedor_id=vendedor_id)
        return {
            "kpis": kpis,
            "detalle": detalle,
            "top_vendedores": top_vendedores,
            "planes_mas_vendidos": planes,
        }

    def obtener_reporte_uso_sistema_superadmin(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None):
        return self.svc_r033.obtener_reporte_uso_sistema(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
