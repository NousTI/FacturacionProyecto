from fastapi import Depends
from datetime import datetime, timedelta
from typing import List, Dict, Any
from ...database.session import get_db

class RepositorioDashboards:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_estadisticas_generales(self) -> Dict[str, Any]:
        stats = {}
        with self.db.cursor() as cur:
            cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.empresas")
            stats['total_empresas'] = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.empresas WHERE activo = true")
            stats['empresas_activas'] = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.usuarios")
            stats['total_usuarios'] = cur.fetchone()['count']
            
            cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM sistema_facturacion.pagos_suscripciones WHERE estado = 'PAGADO'")
            stats['total_ingresos'] = float(cur.fetchone()['total'])
            
            cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM sistema_facturacion.comisiones WHERE estado = 'PENDIENTE'")
            stats['comisiones_pendientes_monto'] = float(cur.fetchone()['total'])
            
            cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.comisiones WHERE estado = 'PENDIENTE'")
            stats['comisiones_pendientes_count'] = cur.fetchone()['count']

            # Facturas totales del sistema
            cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.facturas WHERE estado != 'ANULADA'")
            stats['total_facturas'] = cur.fetchone()['count']

            # Errores SRI recientes
            cur.execute("""
                SELECT COUNT(*) as count FROM sistema_facturacion.autorizaciones_sri 
                WHERE estado = 'RECHAZADO' AND created_at > CURRENT_DATE - INTERVAL '24 hours'
            """)
            stats['errores_sri_count'] = cur.fetchone()['count']

            # Certificados por vencer
            cur.execute("""
                SELECT COUNT(*) as count FROM sistema_facturacion.configuraciones_sri 
                WHERE fecha_expiracion_cert <= CURRENT_DATE + INTERVAL '10 days' AND estado = 'ACTIVO'
            """)
            stats['certificados_vencer'] = cur.fetchone()['count']

        return stats

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
        
        # Para filtros que no son truncamiento (como 'all'), usaremos una condición diferente
        period_condition = intervals.get(periodo, intervals['month'])
        
        # Filtro de fecha base
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

                # Cuentas por cobrar - Real (Total - Pagos en tabla pagos_factura)
                # NOTA: Se quita date_filter para que el KPI de saldos sea el real histórico, no solo del mes
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

    def obtener_variacion_ingresos(self) -> float:
        """Calcula variación porcentual de ingresos vs mes anterior."""
        with self.db.cursor() as cur:
            # Mes actual
            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) as total 
                FROM sistema_facturacion.pagos_suscripciones 
                WHERE estado = 'PAGADO'
                AND DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)
            """)
            actual = float(cur.fetchone()['total'])

            # Mes anterior
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

    def obtener_pagos_atrasados(self) -> int:
        """Cuenta pagos de suscripción atrasados (empresas vencidas)."""
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) as count 
                FROM sistema_facturacion.empresas e
                JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id
                WHERE s.fecha_fin < CURRENT_DATE
                AND e.activo = true
                AND s.estado = 'ACTIVA'
            """)
            return cur.fetchone()['count']

    def obtener_alertas_sistema(self, vendedor_id=None, empresa_id=None) -> Dict[str, List[Dict[str, Any]]]:
        """Obtiene alertas categorizadas por rol."""
        alertas = {"criticas": [], "advertencias": [], "informativas": []}
        
        with self.db.cursor() as cur:
            if empresa_id:
                # Alertas para Empresa
                cur.execute("""
                    SELECT s.fecha_fin as fecha_vencimiento 
                    FROM sistema_facturacion.suscripciones s 
                    WHERE s.empresa_id = %s AND s.estado = 'ACTIVA'
                """, (empresa_id,))
                row = cur.fetchone()
                if row and row['fecha_vencimiento']:
                    fecha_venc = row['fecha_vencimiento']
                    # Asegurar comparación entre objetos del mismo tipo (date)
                    if hasattr(fecha_venc, 'date'):
                        fecha_venc = fecha_venc.date()
                        
                    if fecha_venc < (datetime.now().date() + timedelta(days=7)):

                     alertas["criticas"].append({
                        "tipo": "Suscripción",
                        "cantidad": 1,
                        "nivel": "critical",
                        "mensaje": "Su suscripción vence pronto"
                    })
            
            elif vendedor_id:
                # Alertas para Vendedor (Sus clientes)
                cur.execute("""
                    SELECT COUNT(*) as count 
                    FROM sistema_facturacion.empresas e
                    JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id
                    WHERE e.vendedor_id = %s AND s.fecha_fin < CURRENT_DATE AND e.activo = true
                """, (vendedor_id,))
                vencidas = cur.fetchone()['count']
                if vencidas > 0:
                    alertas["criticas"].append({
                        "tipo": "Clientes Vencidos",
                        "cantidad": vencidas,
                        "nivel": "critical",
                        "mensaje": f"{vencidas} de sus empresas tienen pagos atrasados"
                    })
            else:
                # Alertas Globales (Superadmin)
                cur.execute("""
                    SELECT COUNT(*) as count FROM sistema_facturacion.empresas 
                    WHERE id NOT IN (SELECT DISTINCT empresa_id FROM sistema_facturacion.facturas WHERE fecha_emision > CURRENT_DATE - INTERVAL '30 days')
                """)
                inactivas = cur.fetchone()['count']
                if inactivas > 0:
                    alertas["advertencias"].append({
                        "tipo": "Inactividad",
                        "cantidad": inactivas,
                        "nivel": "warning",
                        "mensaje": f"{inactivas} empresas sin facturación en 30 días"
                    })

                cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.comisiones WHERE estado = 'PENDIENTE'")
                comisiones = cur.fetchone()['count']
                if comisiones > 0:
                    alertas["informativas"].append({
                        "tipo": "Comisiones",
                        "cantidad": comisiones,
                        "nivel": "info",
                        "mensaje": f"{comisiones} comisiones por liquidar a vendedores"
                    })

                # Alerta de Certificados SRI por expirar
                try:
                    cur.execute("""
                        SELECT COUNT(*) as count 
                        FROM sistema_facturacion.configuraciones_sri 
                        WHERE fecha_expiracion_cert <= CURRENT_DATE + INTERVAL '15 days'
                        AND estado = 'ACTIVO'
                    """)
                    cert_vencidos = cur.fetchone()['count']
                    if cert_vencidos > 0:
                        alertas["criticas"].append({
                            "tipo": "Certificados SRI",
                            "cantidad": cert_vencidos,
                            "nivel": "critical",
                            "mensaje": f"{cert_vencidos} empresas con firma electrónica próxima a vencer"
                        })
                except:
                    pass # Evitar que falle si la tabla no existe o no tiene permisos

        return alertas

    def obtener_facturas_mensuales(self, limite: int = 6, empresa_id=None, periodo: str = 'month') -> List[Dict[str, Any]]:
        where_clause = "AND f.empresa_id = %s" if empresa_id else ""
        
        # Ajustar intervalo según periodo para el gráfico
        if periodo == 'year':
             interval = '1 month'
             limite = 12
        elif periodo == 'week':
             interval = '1 day'
             limite = 7
        else:
             interval = '1 month'
             limite = 6

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
            interval = '1 month'
            limite = 12
            trunc = 'month'
            format_str = 'Mon'
            comp_interval = '1 year'
        elif periodo == 'week':
            interval = '1 day'
            limite = 7
            trunc = 'day'
            format_str = 'DD/MM'
            comp_interval = '7 days'
        elif periodo == 'day':
            # Para día, comparamos con las horas de hoy vs ayer? 
            # O mejor comparamos 7 días atrás para dar contexto?
            # El usuario pidió "día, semana, mes". 
            # Si es por día, quizás mostramos las últimas 24h?
            interval = '1 hour'
            limite = 24
            trunc = 'hour'
            format_str = 'HH'
            comp_interval = '24 hours'
        else: # month
            interval = '1 day'
            limite = 30
            trunc = 'day'
            format_str = 'DD'
            comp_interval = '30 days'

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
        # Ajustar intervalo según periodo para el gráfico
        if periodo == 'year':
             interval = '1 month' # Para año mostrar meses tiene sentido
             limite = 12
        elif periodo == 'week':
             interval = '1 day'
             limite = 7
        else:
             interval = '1 month'
             limite = 6

        trunc_type = "month" if interval == "1 month" else "day"
        format_type = "Mon" if interval == "1 month" else "DD/MM"

        # Para vendedor son sus comisiones, para superadmin son suscripciones
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

    def obtener_empresas_por_plan(self) -> List[Dict[str, Any]]:
        query = """
            WITH LatestSubscription AS (
                SELECT DISTINCT ON (empresa_id) empresa_id, plan_id
                FROM sistema_facturacion.pagos_suscripciones WHERE estado = 'PAGADO'
                ORDER BY empresa_id, fecha_inicio_periodo DESC
            )
            SELECT p.nombre, COUNT(ls.empresa_id) as count
            FROM sistema_facturacion.planes p LEFT JOIN LatestSubscription ls ON p.id = ls.plan_id
            GROUP BY p.nombre ORDER BY count DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            return [{"name": r['nombre'], "count": r['count']} for r in cur.fetchall()]

    def obtener_empresas_recientes(self, limite: int = 5) -> List[Dict[str, Any]]:
        query = """
            SELECT 
                e.id, 
                e.nombre_comercial, 
                e.activo, 
                e.created_at as fecha_registro,
                p.nombre as plan_nombre
            FROM sistema_facturacion.empresas e
            LEFT JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id AND s.estado = 'ACTIVA'
            LEFT JOIN sistema_facturacion.planes p ON s.plan_id = p.id
            ORDER BY e.created_at DESC
            LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (limite,))
            return [dict(r) for r in cur.fetchall()]

    # =========================================================
    # METODOS DASHBOARD USUARIO (MOCKUP IMPLEMENTATION)
    # =========================================================

    def obtener_consumo_plan(self, empresa_id: str) -> Dict[str, Any]:
        """Obtiene detalles de la suscripción y el consumo actual vs límite."""
        query = """
            SELECT 
                p.nombre as plan_nombre,
                s.fecha_inicio,
                s.fecha_fin,
                s.estado as suscripcion_estado,
                COALESCE(p.max_facturas_mes, 0) as limite,
                (SELECT COUNT(*) FROM sistema_facturacion.facturas f 
                 WHERE f.empresa_id = s.empresa_id 
                 AND DATE_TRUNC('month', f.fecha_emision) = DATE_TRUNC('month', CURRENT_DATE)
                 AND f.estado != 'ANULADA') as actual
            FROM sistema_facturacion.suscripciones s
            JOIN sistema_facturacion.planes p ON s.plan_id = p.id
            WHERE s.empresa_id = %s
            ORDER BY s.updated_at DESC
            LIMIT 1
        """
        with self.db.cursor() as cur:
            cur.execute(query, (empresa_id,))
            res = cur.fetchone()
            if res:
                return {
                    "nombre_plan": res['plan_nombre'],
                    "fecha_inicio": res['fecha_inicio'].isoformat() if res['fecha_inicio'] and hasattr(res['fecha_inicio'], 'isoformat') else str(res['fecha_inicio']),
                    "fecha_vencimiento": res['fecha_fin'].isoformat() if res['fecha_fin'] and hasattr(res['fecha_fin'], 'isoformat') else str(res['fecha_fin']),
                    "estado": res['suscripcion_estado'],
                    "actual": res['actual'],
                    "limite": res['limite']
                }
            return {
                "nombre_plan": "Sin Plan",
                "fecha_inicio": None,
                "fecha_vencimiento": None,
                "estado": "INACTIVA",
                "actual": 0,
                "limite": 0
            }

    def obtener_info_firma(self, empresa_id: str) -> Dict[str, Any]:
        """Obtiene días restantes y fecha de expiración de la firma."""
        query = """
            SELECT 
                fecha_expiracion_cert as fecha,
                EXTRACT(DAY FROM (fecha_expiracion_cert - CURRENT_DATE)) as dias_restantes
            FROM sistema_facturacion.configuraciones_sri
            WHERE empresa_id = %s AND estado = 'ACTIVO'
            LIMIT 1
        """
        with self.db.cursor() as cur:
            cur.execute(query, (empresa_id,))
            res = cur.fetchone()
            if res:
                return {
                    "fecha": res['fecha'].isoformat() if res['fecha'] and hasattr(res['fecha'], 'isoformat') else str(res['fecha']),
                    "dias_restantes": int(res['dias_restantes']) if res['dias_restantes'] is not None else -1
                }
            return {"fecha": None, "dias_restantes": -1}

    def obtener_top_productos(self, empresa_id: str, limite: int = 3) -> List[Dict[str, Any]]:
        """Obtiene los productos más vendidos por monto total."""
        query = """
            SELECT 
                p.nombre,
                SUM(d.cantidad) as cantidad,
                SUM(d.subtotal + d.valor_iva) as total
            FROM sistema_facturacion.facturas_detalle d

            JOIN sistema_facturacion.facturas f ON d.factura_id = f.id
            JOIN sistema_facturacion.productos p ON d.producto_id = p.id
            WHERE f.empresa_id = %s AND f.estado != 'ANULADA'
            GROUP BY p.nombre
            ORDER BY total DESC
            LIMIT %s
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

    def obtener_facturas_recientes(self, empresa_id: str, limite: int = 5) -> List[Dict[str, Any]]:
        """Obtiene las últimas facturas emitidas por la empresa."""
        query = """
            SELECT 
                f.id,
                f.numero_factura as numero,
                c.razon_social as cliente,
                f.total as total,
                f.estado,
                f.fecha_emision as fecha
            FROM sistema_facturacion.facturas f

            JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
            WHERE f.empresa_id = %s
            ORDER BY f.fecha_emision DESC, f.created_at DESC
            LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (empresa_id, limite))
            return [
                {
                    "id": str(r['id']),
                    "numero": r['numero'],
                    "cliente": r['cliente'],
                    "total": float(r['total']),
                    "estado": r['estado'],
                    "fecha": r['fecha'].isoformat() if hasattr(r['fecha'], 'isoformat') else str(r['fecha'])
                } for r in cur.fetchall()
            ]

    def obtener_distribucion_pagos(self, empresa_id: str, periodo: str = 'month') -> List[Dict[str, Any]]:
        """Calcula la distribución de pagos mapeando nombres legibles."""
        
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
            
            if not resultados:
                return []

            # Mapeo SRI a etiquetas bonitas
            labels = {
                '01': 'Efectivo',
                '15': 'Compensador Deudas',
                '16': 'Tarjeta Débito',
                '17': 'Dinero Electrónico',
                '18': 'Tarjeta Prepago',
                '19': 'Tarjeta Crédito',
                '20': 'Otros Sist. Financiero',
                '21': 'Endoso Títulos'
            }

            return [
                {
                    "label": labels.get(str(r['forma_pago_sri']).strip().zfill(2), f"SRI {r['forma_pago_sri']}"),
                    "value": float(r['total'])
                } for r in resultados
            ]



