from uuid import UUID
from typing import Dict, Any
from datetime import datetime, timedelta
from .repository import RepositorioR001Empleados
from fastapi import Depends


class ServicioR001Empleados:
    def __init__(self, repo: RepositorioR001Empleados = Depends()):
        self.repo = repo

    def generar_mis_ventas(self, empresa_id: UUID, usuario_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """R-001 Empleados: vista de ventas propias, filtrada por usuario_id."""

        # Período anterior para variaciones
        d1 = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        d2 = datetime.strptime(fecha_fin, '%Y-%m-%d')
        delta = (d2 - d1).days + 1
        prev_inicio = (d1 - timedelta(days=delta)).strftime('%Y-%m-%d')
        prev_fin = (d1 - timedelta(days=1)).strftime('%Y-%m-%d')

        kpis_actual = self.repo.obtener_kpis_propios(empresa_id, usuario_id, fecha_inicio, fecha_fin)
        kpis_prev   = self.repo.obtener_kpis_propios(empresa_id, usuario_id, prev_inicio, prev_fin)

        facturas_recientes = self.repo.obtener_facturas_recientes(empresa_id, usuario_id, fecha_inicio, fecha_fin)
        mis_clientes       = self.repo.obtener_mis_clientes(empresa_id, usuario_id, fecha_inicio, fecha_fin)
        nombre_empleado    = self.repo.obtener_nombre_empleado(usuario_id)

        def calc_var(actual, anterior) -> float:
            actual, anterior = float(actual), float(anterior)
            if anterior == 0:
                return 100.0 if actual > 0 else 0.0
            return round(((actual - anterior) / anterior) * 100, 1)

        return {
            "empleado": nombre_empleado,
            "kpis": {
                "mis_facturas": {
                    "valor": int(kpis_actual["mis_facturas"]),
                    "variacion": calc_var(kpis_actual["mis_facturas"], kpis_prev["mis_facturas"])
                },
                "total_vendido": {
                    "valor": float(kpis_actual["total_vendido"]),
                    "variacion": calc_var(kpis_actual["total_vendido"], kpis_prev["total_vendido"])
                },
                "devoluciones": {
                    "valor": int(kpis_actual["devoluciones"]),
                    "variacion": calc_var(kpis_actual["devoluciones"], kpis_prev["devoluciones"])
                },
                "ticket_promedio": {
                    "valor": float(kpis_actual["ticket_promedio"]),
                    "variacion": calc_var(kpis_actual["ticket_promedio"], kpis_prev["ticket_promedio"])
                }
            },
            "facturas_recientes": [
                {
                    "numero_factura": f["numero_factura"],
                    "cliente": f["cliente"],
                    "fecha": str(f["fecha"]),
                    "total": float(f["total"]),
                    "estado": f["estado"]
                }
                for f in facturas_recientes
            ],
            "mis_clientes": [
                {
                    "cliente": c["cliente"],
                    "facturas": int(c["facturas"]),
                    "total_compras": float(c["total_compras"]),
                    "ultima_compra": str(c["ultima_compra"]),
                    "estado": c["estado"]
                }
                for c in mis_clientes
            ]
        }
