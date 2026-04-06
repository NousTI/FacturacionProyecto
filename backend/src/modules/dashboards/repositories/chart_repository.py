from typing import List, Dict, Any
from .base import BaseRepository

class ChartRepository(BaseRepository):
    def obtener_facturas_mensuales(self, limite: int = 6, empresa_id=None, periodo: str = 'month') -> List[Dict[str, Any]]:
        where_clause = "AND f.empresa_id = %s" if empresa_id else ""
        
        if periodo == 'year':
             interval = '1 month'; limite = 12
        elif periodo == 'week':
             interval = '1 day'; limite = 7
        else:
             interval = '1 month'; limite = 6

        params = (limite - 1, empresa_id) if empresa_id else (limite - 1,)
        
        query = f"""
            WITH months AS (
                SELECT generate_series(DATE_TRUNC('{"month" if interval == "1 month" else "day"}', CURRENT_DATE) - (INTERVAL '{interval}' * %s),
                                     DATE_TRUNC('{"month" if interval == "1 month" else "day"}', CURRENT_DATE), '{interval}'::interval) as month
            )
            SELECT TO_CHAR(m.month, '{"Mon" if interval == "1 month" else "DD/MM"}') as label, COALESCE(COUNT(f.id), 0) as value
            FROM months m
            LEFT JOIN sistema_facturacion.facturas f ON DATE_TRUNC('{"month" if interval == "1 month" else "day"}', f.fecha_emision) = m.month 
                 AND f.estado != 'ANULADA' {where_clause}
            GROUP BY m.month ORDER BY m.month ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, params)
            return [{"label": r['label'], "value": r['value']} for r in cur.fetchall()]

    def obtener_ventas_tendencia(self, empresa_id: str, periodo: str = 'month') -> List[Dict[str, Any]]:
        """Obtiene la tendencia de ventas (monto) para el periodo seleccionado con comparación."""
        if periodo == 'year':
            interval = '1 month'; limite = 12; trunc = 'month'; format_str = 'Mon'; comp_interval = '1 year'
        elif periodo == 'week':
            interval = '1 day'; limite = 7; trunc = 'day'; format_str = 'DD/MM'; comp_interval = '7 days'
        elif periodo == 'day':
            interval = '1 hour'; limite = 24; trunc = 'hour'; format_str = 'HH'; comp_interval = '24 hours'
        else: # month
            interval = '1 day'; limite = 30; trunc = 'day'; format_str = 'DD'; comp_interval = '30 days'

        query = f"""
            WITH actual_periods AS (
                SELECT generate_series(
                    DATE_TRUNC('{trunc}', CURRENT_DATE) - (INTERVAL '{interval}' * %s),
                    DATE_TRUNC('{trunc}', CURRENT_DATE), 
                    '{interval}'::interval
                ) as period
            ),
            data_actual AS (
                SELECT DATE_TRUNC('{trunc}', fecha_emision) as p, SUM(total) as val
                FROM sistema_facturacion.facturas
                WHERE empresa_id = %s AND estado != 'ANULADA'
                AND fecha_emision >= DATE_TRUNC('{trunc}', CURRENT_DATE) - (INTERVAL '{interval}' * %s)
                GROUP BY 1
            ),
            data_prev AS (
                SELECT DATE_TRUNC('{trunc}', fecha_emision + INTERVAL '{comp_interval}') as p, SUM(total) as val
                FROM sistema_facturacion.facturas
                WHERE empresa_id = %s AND estado != 'ANULADA'
                AND fecha_emision >= DATE_TRUNC('{trunc}', CURRENT_DATE) - (INTERVAL '{interval}' * %s) - INTERVAL '{comp_interval}'
                AND fecha_emision < DATE_TRUNC('{trunc}', CURRENT_DATE) - INTERVAL '{comp_interval}' + INTERVAL '{interval}'
                GROUP BY 1
            )
            SELECT 
                TO_CHAR(ap.period, '{format_str}') as label, 
                COALESCE(da.val, 0) as value,
                COALESCE(dp.val, 0) as value_prev
            FROM actual_periods ap
            LEFT JOIN data_actual da ON da.p = ap.period
            LEFT JOIN data_prev dp ON dp.p = ap.period
            ORDER BY ap.period ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (limite - 1, empresa_id, limite - 1, empresa_id, limite - 1))
            return [
                {
                    "label": r['label'], 
                    "value": float(r['value']),
                    "value_prev": float(r['value_prev'])
                } for r in cur.fetchall()
            ]

    def obtener_ingresos_mensuales(self, limite: int = 6, vendedor_id=None, periodo: str = 'month') -> List[Dict[str, Any]]:
        if periodo == 'year':
             interval = '1 month'; limite = 12
        elif periodo == 'week':
             interval = '1 day'; limite = 7
        else:
             interval = '1 month'; limite = 6

        trunc_type = "month" if interval == "1 month" else "day"
        format_type = "Mon" if interval == "1 month" else "DD/MM"

        if vendedor_id:
             query = f"""
                WITH months AS (
                    SELECT generate_series(DATE_TRUNC('{trunc_type}', CURRENT_DATE) - (INTERVAL '{interval}' * %s),
                                         DATE_TRUNC('{trunc_type}', CURRENT_DATE), '{interval}'::interval) as month
                )
                SELECT TO_CHAR(m.month, '{format_type}') as label, COALESCE(SUM(c.monto), 0) as value
                FROM months m
                LEFT JOIN sistema_facturacion.comisiones c ON DATE_TRUNC('{trunc_type}', c.fecha_creacion) = m.month 
                     AND c.vendedor_id = %s AND c.estado = 'PAGADA'
                GROUP BY m.month ORDER BY m.month ASC
            """
             params = (limite - 1, vendedor_id)
        else:
            query = f"""
                WITH months AS (
                    SELECT generate_series(DATE_TRUNC('{trunc_type}', CURRENT_DATE) - (INTERVAL '{interval}' * %s),
                                         DATE_TRUNC('{trunc_type}', CURRENT_DATE), '{interval}'::interval) as month
                )
                SELECT TO_CHAR(m.month, '{format_type}') as label, COALESCE(SUM(p.monto), 0) as value
                FROM months m
                LEFT JOIN sistema_facturacion.pagos_suscripciones p ON DATE_TRUNC('{trunc_type}', p.fecha_pago) = m.month 
                     AND p.estado = 'PAGADO'
                GROUP BY m.month ORDER BY m.month ASC
            """
            params = (limite - 1,)

        with self.db.cursor() as cur:
            cur.execute(query, params)
            return [{"label": r['label'], "value": float(r['value'])} for r in cur.fetchall()]

    def obtener_distribucion_pagos(self, empresa_id: str, periodo: str = 'month') -> List[Dict[str, Any]]:
        if periodo in ['today', 'day']:
            date_filter = "f.fecha_emision::date = CURRENT_DATE"
        elif periodo == 'week':
            date_filter = "f.fecha_emision >= CURRENT_DATE - INTERVAL '7 days'"
        else: # month
            date_filter = "f.fecha_emision >= CURRENT_DATE - INTERVAL '30 days'"

        query = f"""
            SELECT p.forma_pago_sri, SUM(p.valor) as total
            FROM sistema_facturacion.facturas f
            JOIN sistema_facturacion.formas_pago p ON f.id = p.factura_id
            WHERE f.empresa_id = %s AND f.estado != 'ANULADA'
            AND {date_filter}
            GROUP BY p.forma_pago_sri
            ORDER BY total DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (empresa_id,))
            resultados = cur.fetchall()
            if not resultados: return []

            labels = {
                '01': 'Efectivo', '15': 'Compensador Deudas', '16': 'Tarjeta Débito',
                '17': 'Dinero Electrónico', '18': 'Tarjeta Prepago', '19': 'Tarjeta Crédito',
                '20': 'Otros Sist. Financiero', '21': 'Endoso Títulos'
            }

            return [
                {
                    "label": labels.get(str(r['forma_pago_sri']).strip().zfill(2), f"SRI {r['forma_pago_sri']}"),
                    "value": float(r['total'])
                } for r in resultados
            ]

    def obtener_top_productos(self, empresa_id: str, limite: int = 3) -> List[Dict[str, Any]]:
        query = """
            SELECT p.nombre, SUM(d.cantidad) as cantidad, SUM(d.subtotal + d.valor_iva) as total
            FROM sistema_facturacion.facturas_detalle d
            JOIN sistema_facturacion.facturas f ON d.factura_id = f.id
            JOIN sistema_facturacion.productos p ON d.producto_id = p.id
            WHERE f.empresa_id = %s AND f.estado != 'ANULADA'
            GROUP BY p.nombre ORDER BY total DESC LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (empresa_id, limite))
            return [
                {
                    "nombre": r['nombre'], 
                    "cantidad": int(r['cantidad']) if r['cantidad'] else 0, 
                    "total": float(r['total']) if r['total'] else 0.0
                } for r in cur.fetchall()
            ]
