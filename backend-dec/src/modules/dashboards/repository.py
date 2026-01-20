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
