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
            cur.execute("SELECT COUNT(*) as count FROM empresa")
            stats['total_empresas'] = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) as count FROM empresa WHERE activo = true")
            stats['empresas_activas'] = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) as count FROM usuario")
            stats['total_usuarios'] = cur.fetchone()['count']
            
            cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM pago_suscripcion WHERE estado = 'PAGADO'")
            stats['total_ingresos'] = float(cur.fetchone()['total'])
            
            cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM comision WHERE estado = 'PENDIENTE'")
            stats['comisiones_pendientes_monto'] = float(cur.fetchone()['total'])
            
            cur.execute("SELECT COUNT(*) as count FROM comision WHERE estado = 'PENDIENTE'")
            stats['comisiones_pendientes_count'] = cur.fetchone()['count']

        return stats

    def obtener_kpis_principales(self, vendedor_id=None, empresa_id=None) -> Dict[str, Any]:
        """Obtiene métricas principales para los KPIs."""
        kpis = {}
        with self.db.cursor() as cur:
            if empresa_id:
                # KPIs para Empresa
                # 1. Ventas mes actual (Facturas no anuladas)
                cur.execute("""
                    SELECT COALESCE(SUM(total), 0) as total 
                    FROM factura 
                    WHERE empresa_id = %s 
                    AND estado != 'ANULADA'
                    AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', CURRENT_DATE)
                """, (empresa_id,))
                kpis['ventas_mes'] = float(cur.fetchone()['total'])

                # 2. Ventas hoy
                cur.execute("""
                    SELECT COALESCE(SUM(total), 0) as total 
                    FROM factura 
                    WHERE empresa_id = %s 
                    AND estado != 'ANULADA'
                    AND fecha_emision::date = CURRENT_DATE
                """, (empresa_id,))
                kpis['ventas_hoy'] = float(cur.fetchone()['total'])

                # 3. Cuentas por cobrar (Facturas con saldo > 0)
                cur.execute("SELECT COALESCE(SUM(total), 0) as total FROM factura WHERE empresa_id = %s AND estado = 'AUTORIZADO'", (empresa_id,))
                kpis['cuentas_cobrar'] = float(cur.fetchone()['total'])
                
                kpis['productos_stock_bajo'] = 0 # Placeholder
                kpis['facturas_rechazadas'] = 0 # Placeholder

            elif vendedor_id:
                # KPIs para Vendedor
                cur.execute("SELECT COUNT(*) as count FROM empresa WHERE vendedor_id = %s AND activo = true", (vendedor_id,))
                kpis['empresas_activas'] = cur.fetchone()['count']

                cur.execute("""
                    SELECT COALESCE(SUM(monto), 0) as total FROM comision 
                    WHERE vendedor_id = %s AND estado = 'PENDIENTE'
                """, (vendedor_id,))
                kpis['comisiones_pendientes'] = float(cur.fetchone()['total'])

                cur.execute("""
                    SELECT COUNT(*) as count FROM empresa 
                    WHERE vendedor_id = %s AND fecha_vencimiento < CURRENT_DATE AND activo = true
                """, (vendedor_id,))
                kpis['pagos_atrasados'] = cur.fetchone()['count']
            else:
                # KPIs Globales (Superadmin)
                cur.execute("SELECT COUNT(*) as count FROM empresa WHERE activo = true")
                kpis['empresas_activas'] = cur.fetchone()['count']

                cur.execute("""
                    SELECT COALESCE(SUM(monto), 0) as total 
                    FROM pago_suscripcion 
                    WHERE estado = 'PAGADO'
                    AND DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)
                """)
                kpis['ingresos_mensuales'] = float(cur.fetchone()['total'])

                cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM comision WHERE estado = 'PENDIENTE'")
                kpis['comisiones_pendientes'] = float(cur.fetchone()['total'])

                cur.execute("""
                    SELECT COUNT(DISTINCT e.id) as count FROM empresa e
                    WHERE e.activo = true AND e.fecha_vencimiento > CURRENT_DATE 
                    AND e.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'
                """)
                kpis['empresas_por_vencer'] = cur.fetchone()['count']

        return kpis

    def obtener_variacion_ingresos(self) -> float:
        """Calcula variación porcentual de ingresos vs mes anterior."""
        with self.db.cursor() as cur:
            # Mes actual
            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) as total 
                FROM pago_suscripcion 
                WHERE estado = 'PAGADO'
                AND DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)
            """)
            actual = float(cur.fetchone()['total'])

            # Mes anterior
            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) as total 
                FROM pago_suscripcion 
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
                FROM empresa 
                WHERE fecha_vencimiento < CURRENT_DATE
                AND activo = true
            """)
            return cur.fetchone()['count']

    def obtener_alertas_sistema(self, vendedor_id=None, empresa_id=None) -> Dict[str, List[Dict[str, Any]]]:
        """Obtiene alertas categorizadas por rol."""
        alertas = {"criticas": [], "advertencias": [], "informativas": []}
        
        with self.db.cursor() as cur:
            if empresa_id:
                # Alertas para Empresa
                cur.execute("SELECT fecha_vencimiento FROM empresa WHERE id = %s", (empresa_id,))
                row = cur.fetchone()
                if row and row['fecha_vencimiento'] and row['fecha_vencimiento'] < (datetime.now().date() + timedelta(days=7)):
                     alertas["criticas"].append({
                        "tipo": "Suscripción",
                        "cantidad": 1,
                        "nivel": "critical",
                        "mensaje": "Su suscripción vence pronto"
                    })
            
            elif vendedor_id:
                # Alertas para Vendedor (Sus clientes)
                cur.execute("""
                    SELECT COUNT(*) as count FROM empresa 
                    WHERE vendedor_id = %s AND fecha_vencimiento < CURRENT_DATE AND activo = true
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
                    SELECT COUNT(*) as count FROM empresa 
                    WHERE id NOT IN (SELECT DISTINCT empresa_id FROM factura WHERE fecha_emision > CURRENT_DATE - INTERVAL '30 days')
                """)
                inactivas = cur.fetchone()['count']
                if inactivas > 0:
                    alertas["advertencias"].append({
                        "tipo": "Inactividad",
                        "cantidad": inactivas,
                        "nivel": "warning",
                        "mensaje": f"{inactivas} empresas sin facturación en 30 días"
                    })

                cur.execute("SELECT COUNT(*) as count FROM comision WHERE estado = 'PENDIENTE'")
                comisiones = cur.fetchone()['count']
                if comisiones > 0:
                    alertas["informativas"].append({
                        "tipo": "Comisiones",
                        "cantidad": comisiones,
                        "nivel": "info",
                        "mensaje": f"{comisiones} comisiones pendientes"
                    })

        return alertas

    def obtener_facturas_mensuales(self, limite: int = 6, empresa_id=None) -> List[Dict[str, Any]]:
        where_clause = "AND f.empresa_id = %s" if empresa_id else ""
        params = (limite - 1, empresa_id) if empresa_id else (limite - 1,)
        
        query = f"""
            WITH months AS (
                SELECT generate_series(DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * %s),
                                     DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) as month
            )
            SELECT TO_CHAR(m.month, 'Mon') as label, COALESCE(COUNT(f.id), 0) as value
            FROM months m
            LEFT JOIN factura f ON DATE_TRUNC('month', f.fecha_emision) = m.month 
                 AND f.estado != 'ANULADA' {where_clause}
            GROUP BY m.month ORDER BY m.month ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, params)
            return [{"label": r['label'], "value": r['value']} for r in cur.fetchall()]

    def obtener_ingresos_mensuales(self, limite: int = 6, vendedor_id=None) -> List[Dict[str, Any]]:
        # Para vendedor son sus comisiones, para superadmin son suscripciones
        if vendedor_id:
             query = """
                WITH months AS (
                    SELECT generate_series(DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * %s),
                                         DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) as month
                )
                SELECT TO_CHAR(m.month, 'Mon') as label, COALESCE(SUM(c.monto), 0) as value
                FROM months m
                LEFT JOIN comision c ON DATE_TRUNC('month', c.fecha_creacion) = m.month 
                     AND c.vendedor_id = %s AND c.estado = 'PAGADA'
                GROUP BY m.month ORDER BY m.month ASC
            """
             params = (limite - 1, vendedor_id)
        else:
            query = """
                WITH months AS (
                    SELECT generate_series(DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * %s),
                                         DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) as month
                )
                SELECT TO_CHAR(m.month, 'Mon') as label, COALESCE(SUM(p.monto), 0) as value
                FROM months m
                LEFT JOIN pago_suscripcion p ON DATE_TRUNC('month', p.fecha_pago) = m.month 
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
                FROM pago_suscripcion WHERE estado = 'PAGADO'
                ORDER BY empresa_id, fecha_inicio_periodo DESC
            )
            SELECT p.nombre, COUNT(ls.empresa_id) as count
            FROM plan p LEFT JOIN LatestSubscription ls ON p.id = ls.plan_id
            GROUP BY p.nombre ORDER BY count DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            return [{"name": r['nombre'], "count": r['count']} for r in cur.fetchall()]
