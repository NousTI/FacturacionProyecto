from uuid import UUID
from typing import Dict, Any
from datetime import datetime, timedelta
from .repository import RepositorioR028
from ....gastos.gasto_repository import RepositorioGastos
from fastapi import Depends

class ServicioR028:
    def __init__(
        self, 
        repo: RepositorioR028 = Depends(),
        repo_gastos: RepositorioGastos = Depends()
    ):
        self.repo = repo
        self.repo_gastos = repo_gastos

    def generar_resumen_ejecutivo(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Consolida KPIs principales, Radar, Monitor y Gráficas según normas."""

        # 1. Calcular Periodo Anterior (para variaciones)
        d1 = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        d2 = datetime.strptime(fecha_fin, '%Y-%m-%d')
        delta = (d2 - d1).days + 1
        prev_inicio = (d1 - timedelta(days=delta)).strftime('%Y-%m-%d')
        prev_fin = (d1 - timedelta(days=1)).strftime('%Y-%m-%d')

        # 2. Obtener Datos Actuales vs Anteriores para Variaciones
        ventas_actual = self.repo.obtener_kpis_ventas(empresa_id, fecha_inicio, fecha_fin)
        ventas_prev = self.repo.obtener_kpis_ventas(empresa_id, prev_inicio, prev_fin)

        pagos_actual = self.repo.obtener_desglose_pagos(empresa_id, fecha_inicio, fecha_fin)
        pagos_prev = self.repo.obtener_desglose_pagos(empresa_id, prev_inicio, prev_fin)

        clientes_actual = self.repo.obtener_clientes_metricas(empresa_id, fecha_inicio, fecha_fin)
        clientes_prev = self.repo.obtener_clientes_metricas(empresa_id, prev_inicio, prev_fin)

        cartera = self.repo.obtener_datos_cartera(empresa_id)
        radar = self.repo.obtener_radar_gestion(empresa_id)
        monitor = self.repo.obtener_monitor_productos(empresa_id, fecha_inicio, fecha_fin)
        monitor_utilidad = self.repo.obtener_monitor_productos_por_utilidad(empresa_id, fecha_inicio, fecha_fin)

        # 3. Datos de Gastos y Utilidad (ventas - costo_ventas - gastos_operativos)
        gastos_val_actual = self.repo_gastos.obtener_total_gastos(empresa_id, fecha_inicio, fecha_fin)
        costo_ventas = self.repo.obtener_costo_ventas(empresa_id, fecha_inicio, fecha_fin)
        total_facturado = float(ventas_actual['total_facturado'])
        utilidad_neta = total_facturado - costo_ventas - float(gastos_val_actual)
        margen = (utilidad_neta / total_facturado * 100) if total_facturado > 0 else 0

        # 4. Obtener datos para gráficas
        formas_pago_detalle = self.repo.obtener_formas_pago_detalle(empresa_id, fecha_inicio, fecha_fin)
        ventas_anio_anterior = self.repo.obtener_ventas_anio_anterior(empresa_id, fecha_inicio, fecha_fin)

        # Función auxiliar para variaciones
        def calc_var(act, ant):
            act, ant = float(act), float(ant)
            if ant == 0: return 100.0 if act > 0 else 0.0
            return round(((act - ant) / ant) * 100, 1)

        # 5. Preparar datos para gráfica de anillo (ventas año actual vs anterior)
        grafica_anillo = {
            "año_actual": float(ventas_actual['total_facturado']),
            "año_anterior": float(ventas_anio_anterior.get('total_anio_anterior', 0))
        }

        # 6. Preparar datos para gráfica de gastos vs utilidad
        grafica_gastos_utilidad = {
            "gastos": float(gastos_val_actual),
            "utilidad_neta": round(utilidad_neta, 2)
        }

        return {
            "total_facturado": {
                "valor": float(ventas_actual['total_facturado']),
                "variacion": calc_var(ventas_actual['total_facturado'], ventas_prev['total_facturado'])
            },
            "ingreso_efectivo": {
                "valor": float(pagos_actual['efectivo']),
                "variacion": calc_var(pagos_actual['efectivo'], pagos_prev['efectivo'])
            },
            "ingreso_tarjeta": {
                "valor": float(pagos_actual['tarjeta']),
                "variacion": calc_var(pagos_actual['tarjeta'], pagos_prev['tarjeta'])
            },
            "ingreso_otras": {
                "valor": float(pagos_actual['otros']),
                "variacion": calc_var(pagos_actual['otros'], pagos_prev['otros']),
                "formas_pago_detalle": formas_pago_detalle  # Para tooltip
            },
            "por_cobrar": {
                "total": float(cartera['por_cobrar_total']),
                "en_mora": float(cartera['en_mora_30'])
            },
            "clientes_nuevos": {
                "valor": clientes_actual['clientes_nuevos'],
                "variacion": calc_var(clientes_actual['clientes_nuevos'], clientes_prev['clientes_nuevos'])
            },
            "clientes_vip": {
                "valor": clientes_actual['clientes_vip'],
                "periodo": "Este año"
            },
            "utilidad_neta": {
                "valor": round(utilidad_neta, 2),
                "margen": round(margen, 1)
            },
            "radar_gestion": radar,
            "monitor_rentabilidad": monitor,
            "monitor_rentabilidad_por_utilidad": monitor_utilidad,
            "graficas": {
                "anillo_ventas": grafica_anillo,
                "gastos_vs_utilidad": grafica_gastos_utilidad
            }
        }
