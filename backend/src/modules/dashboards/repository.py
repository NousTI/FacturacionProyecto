from fastapi import Depends
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
            
            cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM pago_suscripcion WHERE estado IN ('PAGADO', 'COMPLETED')")
            stats['total_ingresos'] = float(cur.fetchone()['total'])
            
            cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM comision WHERE estado = 'PENDIENTE'")
            stats['comisiones_pendientes_monto'] = float(cur.fetchone()['total'])
            
            cur.execute("SELECT COUNT(*) as count FROM comision WHERE estado = 'PENDIENTE'")
            stats['comisiones_pendientes_count'] = cur.fetchone()['count']

        return stats

    def obtener_kpis_principales(self) -> Dict[str, Any]:
        """Obtiene métricas principales para los KPIs."""
        kpis = {}
        with self.db.cursor() as cur:
            # Empresas activas
            cur.execute("SELECT COUNT(*) as count FROM empresa WHERE activo = true")
            kpis['empresas_activas'] = cur.fetchone()['count']

            # Ingresos mes actual
            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) as total 
                FROM pago_suscripcion 
                WHERE estado IN ('PAGADO', 'COMPLETED')
                AND DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)
            """)
            kpis['ingresos_mensuales'] = float(cur.fetchone()['total'])

            # Comisiones pendientes total
            cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM comision WHERE estado = 'PENDIENTE'")
            kpis['comisiones_pendientes'] = float(cur.fetchone()['total'])

            # Empresas por vencer (KPI agregado)
            # SOLO Plan < 7 dias (Certificado comentado por seguridad de schema)
            cur.execute("""
                SELECT COUNT(DISTINCT e.id) as count
                FROM empresa e
                WHERE e.activo = true
                AND (
                    e.fecha_vencimiento > CURRENT_DATE AND e.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'
                )
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
                WHERE estado IN ('PAGADO', 'COMPLETED')
                AND DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)
            """)
            actual = float(cur.fetchone()['total'])

            # Mes anterior
            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) as total 
                FROM pago_suscripcion 
                WHERE estado IN ('PAGADO', 'COMPLETED')
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

    def obtener_alertas_sistema(self) -> Dict[str, List[Dict[str, Any]]]:
        """Obtiene alertas categorizadas."""
        alertas = {
            "criticas": [],
            "advertencias": [],
            "informativas": []
        }
        
        with self.db.cursor() as cur:
            # CRÍTICAS: Certificados próximos a vencer (ej. < 7 días) o vencidos
            # Simulando consulta a tabla de certificados si existiera, o usando lógica placeholder segura
            # Asumiremos que no hay tabla certificados visible en models, usaremos stubs lógicos o consultas a tablas existentes
            # Para el ejemplo y estabilidad, usaré contadores reales donde pueda.
            
            # Empresas sin actividad reciente (Warning)
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

            # Pagos vencidos (Critical)
            pagos_vencidos = self.obtener_pagos_atrasados()
            if pagos_vencidos > 0:
                alertas["criticas"].append({
                    "tipo": "Pagos Vencidos",
                    "cantidad": pagos_vencidos,
                    "nivel": "critical",
                    "mensaje": f"{pagos_vencidos} pagos de suscripción vencidos"
                })

            # Comisiones acumuladas (Info)
            cur.execute("SELECT COUNT(*) as count FROM comision WHERE estado = 'PENDIENTE'")
            comisiones = cur.fetchone()['count']
            if comisiones > 0:
                alertas["informativas"].append({
                    "tipo": "Comisiones",
                    "cantidad": comisiones,
                    "nivel": "info",
                    "mensaje": f"{comisiones} comisiones pendientes de liquidar"
                })

            # --- NUEVAS ALERTAS POR VENCER ---
            
            # Planes próximos a vencer (Warning) - 3 a 7 días
            cur.execute("""
                SELECT COUNT(*) as count FROM empresa 
                WHERE activo = true 
                AND fecha_vencimiento > CURRENT_DATE 
                AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'
            """)
            planes_por_vencer = cur.fetchone()['count']
            if planes_por_vencer > 0:
                alertas["advertencias"].append({
                    "tipo": "Suscripción",
                    "cantidad": planes_por_vencer,
                    "nivel": "warning",
                    "mensaje": f"{planes_por_vencer} planes vencen en menos de 7 días"
                })

            # Certificados próximos a vencer (Warning) - 7 a 15 días
            # Comentado hasta verificar schema
            # cur.execute("""
            #     SELECT COUNT(*) as count FROM configuracion_sri 
            #     WHERE fecha_expiracion_cert > CURRENT_DATE 
            #     AND fecha_expiracion_cert <= CURRENT_DATE + INTERVAL '15 days'
            # """)
            # certs_por_vencer = cur.fetchone()['count']
            # if certs_por_vencer > 0:
            #     alertas["advertencias"].append({
            #         "tipo": "Certificados",
            #         "cantidad": certs_por_vencer,
            #         "nivel": "warning",
            #         "mensaje": f"{certs_por_vencer} certificados SRI vencen pronto"
            #     })

        return alertas

    def obtener_facturas_mensuales(self, limite: int = 6) -> List[Dict[str, Any]]:
        query = """
            WITH months AS (
                SELECT generate_series(DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * %s),
                                     DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) as month
            )
            SELECT TO_CHAR(m.month, 'Mon') as label, COALESCE(COUNT(f.id), 0) as value
            FROM months m
            LEFT JOIN factura f ON DATE_TRUNC('month', f.fecha_emision) = m.month AND f.estado != 'ANULADA'
            GROUP BY m.month ORDER BY m.month ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (limite - 1,))
            return [{"label": r['label'], "value": r['value']} for r in cur.fetchall()]

    def obtener_ingresos_mensuales(self, limite: int = 6) -> List[Dict[str, Any]]:
        query = """
            WITH months AS (
                SELECT generate_series(DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * %s),
                                     DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) as month
            )
            SELECT TO_CHAR(m.month, 'Mon') as label, COALESCE(SUM(p.monto), 0) as value
            FROM months m
            LEFT JOIN pago_suscripcion p ON DATE_TRUNC('month', p.fecha_pago) = m.month 
                 AND p.estado IN ('PAGADO', 'COMPLETED')
            GROUP BY m.month ORDER BY m.month ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (limite - 1,))
            return [{"label": r['label'], "value": float(r['value'])} for r in cur.fetchall()]

    def obtener_empresas_por_plan(self) -> List[Dict[str, Any]]:
        query = """
            WITH LatestSubscription AS (
                SELECT DISTINCT ON (empresa_id) empresa_id, plan_id
                FROM pago_suscripcion WHERE estado IN ('PAGADO', 'COMPLETED')
                ORDER BY empresa_id, fecha_inicio_periodo DESC
            )
            SELECT p.nombre, COUNT(ls.empresa_id) as count
            FROM plan p LEFT JOIN LatestSubscription ls ON p.id = ls.plan_id
            GROUP BY p.nombre ORDER BY count DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            return [{"name": r['nombre'], "count": r['count']} for r in cur.fetchall()]
