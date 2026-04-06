from datetime import datetime
from uuid import UUID
from typing import Dict, Any
from .base import BaseRepository

class KpiRepository(BaseRepository):
    def obtener_kpis_principales(self, vendedor_id=None, empresa_id=None, periodo: str = 'month') -> Dict[str, Any]:
        """Obtiene métricas principales para los KPIs filtrados por periodo."""
        kpis = {}
        
        # Mapeo de periodos a intervalos de PostgreSQL
        intervals = {
            'day': "CURRENT_DATE",
            'today': "CURRENT_DATE",
            'week': "DATE_TRUNC('week', CURRENT_DATE)",
            'month': "DATE_TRUNC('month', CURRENT_DATE)",
            'year': "DATE_TRUNC('year', CURRENT_DATE)",
            'last_month': "DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')",
            'all': "TO_DATE('2000-01-01', 'YYYY-MM-DD')"
        }
        
        period_condition = intervals.get(periodo, intervals['month'])
        
        if periodo in ['today', 'day']:
            date_filter = "fecha_emision::date = CURRENT_DATE"
            susc_filter = "fecha_pago::date = CURRENT_DATE"
            expired_filter = "s.fecha_fin < CURRENT_DATE"
        elif periodo == 'week':
            date_filter = "fecha_emision >= CURRENT_DATE - INTERVAL '6 days'"
            susc_filter = "fecha_pago >= CURRENT_DATE - INTERVAL '6 days'"
            expired_filter = "s.fecha_fin < CURRENT_DATE"
        elif periodo == 'all':
            date_filter = "1=1"
            susc_filter = "1=1"
            expired_filter = "s.fecha_fin < CURRENT_DATE"
        else:
            date_filter = f"DATE_TRUNC('{periodo if periodo in ['month', 'year'] else 'month'}', fecha_emision) = {period_condition}"
            susc_filter = f"DATE_TRUNC('{periodo if periodo in ['month', 'year'] else 'month'}', fecha_pago) = {period_condition}"
            expired_filter = f"s.fecha_fin < CURRENT_DATE"

        with self.db.cursor() as cur:
            if empresa_id:
                # KPIs para Empresa
                cur.execute(f"""
                    SELECT COALESCE(SUM(total), 0) as total 
                    FROM sistema_facturacion.facturas 
                    WHERE empresa_id = %s 
                    AND estado != 'ANULADA'
                    AND {date_filter}
                """, (empresa_id,))
                kpis['ventas_periodo'] = float(cur.fetchone()['total'])

                cur.execute(f"""
                    SELECT COUNT(*) as count 
                    FROM sistema_facturacion.facturas 
                    WHERE empresa_id = %s 
                    AND estado != 'ANULADA'
                    AND {date_filter}
                """, (empresa_id,))
                kpis['ventas_hoy'] = cur.fetchone()['count']

                cur.execute(f"""
                    SELECT COALESCE(SUM(f.total - COALESCE((
                        SELECT SUM(p.monto) 
                        FROM sistema_facturacion.pagos_factura p 
                        JOIN sistema_facturacion.cuentas_cobrar c ON p.cuenta_cobrar_id = c.id 
                        WHERE c.factura_id = f.id
                    ), 0)), 0) as saldo
                    FROM sistema_facturacion.facturas f 
                    WHERE f.empresa_id = %s 
                    AND f.estado = 'AUTORIZADA' 
                    AND f.estado_pago != 'PAGADO'
                """, (empresa_id,))
                kpis['cuentas_cobrar'] = float(cur.fetchone()['saldo'])
                
                cur.execute("""
                    SELECT COUNT(*) as count 
                    FROM sistema_facturacion.productos 
                    WHERE empresa_id = %s 
                    AND activo = TRUE 
                    AND maneja_inventario = TRUE 
                    AND stock_actual <= stock_minimo
                """, (empresa_id,))
                kpis['productos_stock_bajo'] = cur.fetchone()['count']

                cur.execute(f"""
                    SELECT COUNT(*) as count 
                    FROM sistema_facturacion.facturas 
                    WHERE empresa_id = %s 
                    AND estado = 'RECHAZADA'
                    AND {date_filter}
                """, (empresa_id,))
                kpis['facturas_rechazadas'] = cur.fetchone()['count']

                # --- KPIs Ejecutivos Detallados ---
                cur.execute(f"""
                    SELECT COALESCE(AVG(total), 0) as avg_ticket
                    FROM sistema_facturacion.facturas
                    WHERE empresa_id = %s AND estado != 'ANULADA' AND {date_filter}
                """, (empresa_id,))
                kpis['ticket_promedio'] = float(cur.fetchone()['avg_ticket'])

                cur.execute(f"""
                    SELECT COUNT(DISTINCT cliente_id) as count
                    FROM sistema_facturacion.facturas
                    WHERE empresa_id = %s AND estado != 'ANULADA' AND {date_filter}
                """, (empresa_id,))
                kpis['clientes_activos'] = cur.fetchone()['count']

                cur.execute(f"""
                    WITH pagos as (
                        SELECT SUM(p.monto) as total_pagado
                        FROM sistema_facturacion.pagos_factura p
                        JOIN sistema_facturacion.cuentas_cobrar c ON p.cuenta_cobrar_id = c.id
                        JOIN sistema_facturacion.facturas f ON c.factura_id = f.id
                        WHERE f.empresa_id = %s AND f.estado != 'ANULADA' AND {date_filter.replace('fecha_emision', 'f.fecha_emision')}
                    )
                    SELECT 
                        CASE WHEN v.total > 0 THEN (p.total_pagado / v.total * 100) ELSE 0 END as percent
                    FROM (SELECT COALESCE(SUM(total), 0) as total FROM sistema_facturacion.facturas WHERE empresa_id = %s AND estado != 'ANULADA' AND {date_filter}) v,
                    (SELECT COALESCE(total_pagado, 0) as total_pagado FROM pagos) p
                """, (empresa_id, empresa_id))
                kpis['porcentaje_recuperacion'] = float(cur.fetchone()['percent'])

                cur.execute(f"""
                    SELECT COALESCE(SUM(total), 0) as total
                    FROM sistema_facturacion.gasto
                    WHERE empresa_id = %s AND {date_filter}
                """, (empresa_id,))
                kpis['total_gastos'] = float(cur.fetchone()['total'])

                cur.execute(f"""
                    SELECT COALESCE(SUM(costo_total), 0) as total
                    FROM sistema_facturacion.movimientos_inventario
                    WHERE empresa_id = %s AND tipo_movimiento = 'SALIDA' 
                    AND created_at::date BETWEEN 
                        (SELECT MIN(fecha_emision) FROM sistema_facturacion.facturas WHERE {date_filter})
                        AND (SELECT MAX(fecha_emision) FROM sistema_facturacion.facturas WHERE {date_filter})
                """, (empresa_id,))
                costo_ventas = float(cur.fetchone()['total'] or 0)
                
                kpis['utilidad_bruta'] = kpis['ventas_periodo'] - costo_ventas
                kpis['margen_bruto'] = (kpis['utilidad_bruta'] / kpis['ventas_periodo'] * 100) if kpis['ventas_periodo'] > 0 else 0
                kpis['utilidad_neta'] = kpis['utilidad_bruta'] - kpis['total_gastos']
                kpis['margen_neto'] = (kpis['utilidad_neta'] / kpis['ventas_periodo'] * 100) if kpis['ventas_periodo'] > 0 else 0

            elif vendedor_id:
                # KPIs para Vendedor
                cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.empresas WHERE vendedor_id = %s AND activo = true", (vendedor_id,))
                kpis['empresas_activas'] = cur.fetchone()['count']

                cur.execute(f"""
                    SELECT COALESCE(SUM(monto), 0) as total FROM sistema_facturacion.comisiones 
                    WHERE vendedor_id = %s AND estado = 'PENDIENTE'
                """, (vendedor_id,))
                kpis['comisiones_pendientes'] = float(cur.fetchone()['total'])

                cur.execute(f"""
                    SELECT COUNT(*) as count 
                    FROM sistema_facturacion.empresas e
                    JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id
                    WHERE e.vendedor_id = %s AND {expired_filter} AND e.activo = true
                """, (vendedor_id,))
                kpis['pagos_atrasados'] = cur.fetchone()['count']
            else:
                # KPIs Globales (Superadmin)
                cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.empresas WHERE activo = true")
                kpis['empresas_activas'] = cur.fetchone()['count']

                cur.execute(f"""
                    SELECT COALESCE(SUM(monto), 0) as total 
                    FROM sistema_facturacion.pagos_suscripciones 
                    WHERE estado = 'PAGADO'
                    AND {susc_filter}
                """)
                kpis['ingresos_mensuales'] = float(cur.fetchone()['total'])

                cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM sistema_facturacion.comisiones WHERE estado = 'PENDIENTE'")
                kpis['comisiones_pendientes'] = float(cur.fetchone()['total'])

                cur.execute("""
                    SELECT COUNT(DISTINCT e.id) as count 
                    FROM sistema_facturacion.empresas e
                    JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id
                    WHERE e.activo = true AND s.fecha_fin > CURRENT_DATE 
                    AND s.fecha_fin <= CURRENT_DATE + INTERVAL '7 days'
                    AND s.estado = 'ACTIVA'
                """)
                kpis['empresas_por_vencer'] = cur.fetchone()['count']

                cur.execute(f"""
                    SELECT COUNT(*) as count 
                    FROM sistema_facturacion.empresas e
                    JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id
                    WHERE {expired_filter} AND e.activo = true
                    AND s.estado = 'ACTIVA'
                """)
                kpis['pagos_atrasados'] = cur.fetchone()['count']

        return kpis

    def obtener_variacion_ventas_empresa(self, empresa_id: UUID) -> float:
        """Calcula variación porcentual de ventas de la empresa vs mes anterior."""
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT COALESCE(SUM(total), 0) as total 
                FROM sistema_facturacion.facturas 
                WHERE empresa_id = %s AND estado != 'ANULADA'
                AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', CURRENT_DATE)
            """, (str(empresa_id),))
            actual = float(cur.fetchone()['total'])

            cur.execute("""
                SELECT COALESCE(SUM(total), 0) as total 
                FROM sistema_facturacion.facturas 
                WHERE empresa_id = %s AND estado != 'ANULADA'
                AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            """, (str(empresa_id),))
            anterior = float(cur.fetchone()['total'])

            if anterior == 0: return 100.0 if actual > 0 else 0.0
            return ((actual - anterior) / anterior) * 100

    def obtener_variacion_gastos_empresa(self, empresa_id: UUID) -> float:
        """Calcula variación porcentual de gastos de la empresa vs mes anterior."""
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT COALESCE(SUM(total), 0) as total 
                FROM sistema_facturacion.gasto 
                WHERE empresa_id = %s
                AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', CURRENT_DATE)
            """, (str(empresa_id),))
            actual = float(cur.fetchone()['total'])

            cur.execute("""
                SELECT COALESCE(SUM(total), 0) as total 
                FROM sistema_facturacion.gasto 
                WHERE empresa_id = %s
                AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            """, (str(empresa_id),))
            anterior = float(cur.fetchone()['total'])

            if anterior == 0: return 100.0 if actual > 0 else 0.0
            return ((actual - anterior) / anterior) * 100

    def obtener_variacion_ingresos(self) -> float:
        """Calcula variación porcentual de ingresos vs mes anterior."""
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) as total 
                FROM sistema_facturacion.pagos_suscripciones 
                WHERE estado = 'PAGADO'
                AND DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)
            """)
            actual = float(cur.fetchone()['total'])

            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) as total 
                FROM sistema_facturacion.pagos_suscripciones 
                WHERE estado = 'PAGADO'
                AND DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            """)
            anterior = float(cur.fetchone()['total'])

            if anterior == 0:
                return 100.0 if actual > 0 else 0.0
            
            return ((actual - anterior) / anterior) * 100
