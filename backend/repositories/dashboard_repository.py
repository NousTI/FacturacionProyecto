from fastapi import Depends
from database.connection import get_db_connection
from typing import List, Dict, Any

class DashboardRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def get_general_stats(self) -> Dict[str, Any]:
        if not self.db: return {}
        
        stats = {}
        with self.db.cursor() as cur:
            # Empresas
            cur.execute("SELECT COUNT(*) as count FROM empresa")
            stats['total_empresas'] = cur.fetchone()['count']
            
            # Fix: Boolean handling for 'activo'. In Postgres raw SQL, 'activo = true' or 'activo IS TRUE' usually works.
            # But let's verify if column is named 'activo'. Yes per Empresa.py
            cur.execute("SELECT COUNT(*) as count FROM empresa WHERE activo = true")
            stats['empresas_activas'] = cur.fetchone()['count']
            
            # Usuarios
            cur.execute("SELECT COUNT(*) as count FROM usuario")
            stats['total_usuarios'] = cur.fetchone()['count']
            
            # Facturas
            # User wants "En PROCESO" for display, but let's correct logic anyway to rely on 'EMITIDA' or not 'ANULADA'
            cur.execute("SELECT COUNT(*) as count FROM factura WHERE estado != 'ANULADA'")
            stats['total_facturas'] = cur.fetchone()['count']
            
            # Ingresos Totales (Suscripciones)
            # Ensure we sum decimal correctly and COALESCE null to 0
            cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM pago_suscripcion WHERE estado IN ('PAGADO', 'COMPLETED')")
            row = cur.fetchone()
            stats['total_ingresos'] = float(row['total']) if row and row['total'] is not None else 0.0
            
            # Comisiones Pendientes
            # User mentioned they have one for $12.5 but it shows null.
            # Ensure status is exactly 'PENDIENTE' (case sensitive?) and COALESCE works.
            cur.execute("SELECT COALESCE(SUM(monto), 0) as total FROM comision WHERE estado = 'PENDIENTE'")
            row_monto = cur.fetchone()
            stats['comisiones_pendientes_monto'] = float(row_monto['total']) if row_monto and row_monto['total'] is not None else 0.0
            
            cur.execute("SELECT COUNT(*) as count FROM comision WHERE estado = 'PENDIENTE'")
            stats['comisiones_pendientes_count'] = cur.fetchone()['count']

        return stats

    def get_monthly_invoices(self, limit: int = 6) -> List[Dict[str, Any]]:
        # Use generate_series to ensure all months are present, distinct to avoid duplication if multiple items in generated series? 
        # Actually standard generate_series is fine.
        # limit is number of months. 
        query = """
            WITH months AS (
                SELECT generate_series(
                    DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * %s),
                    DATE_TRUNC('month', CURRENT_DATE),
                    '1 month'::interval
                ) as month
            )
            SELECT 
                TO_CHAR(m.month, 'Mon') as label, 
                COALESCE(COUNT(f.id), 0) as value
            FROM months m
            LEFT JOIN factura f ON DATE_TRUNC('month', f.fecha_emision) = m.month AND f.estado != 'ANULADA'
            GROUP BY m.month
            ORDER BY m.month ASC
        """
        # Note: passed limit-1 effectively if we want inclusive? 
        # SQL logic: CURRENT - 5 months = 6 months total usually. 
        with self.db.cursor() as cur:
            cur.execute(query, (limit - 1,))
            rows = cur.fetchall()
            return [{"label": row['label'], "value": row['value']} for row in rows]

    def get_monthly_revenue(self, limit: int = 6) -> List[Dict[str, Any]]:
        query = """
            WITH months AS (
                SELECT generate_series(
                    DATE_TRUNC('month', CURRENT_DATE) - (INTERVAL '1 month' * %s),
                    DATE_TRUNC('month', CURRENT_DATE),
                    '1 month'::interval
                ) as month
            )
            SELECT 
                TO_CHAR(m.month, 'Mon') as label, 
                COALESCE(SUM(p.monto), 0) as value
            FROM months m
            LEFT JOIN pago_suscripcion p ON DATE_TRUNC('month', p.fecha_pago) = m.month 
                AND p.estado IN ('PAGADO', 'COMPLETED')
            GROUP BY m.month
            ORDER BY m.month ASC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (limit - 1,))
            rows = cur.fetchall()
            return [{"label": row['label'], "value": float(row['value'])} for row in rows]

    def get_companies_by_plan(self) -> List[Dict[str, Any]]:
        # Count companies by their LATEST active subscription plan
        # Refactor: RIGHT JOIN to 'plan' to ensure ALL plans appear, even with 0
        query = """
            WITH LatestSubscription AS (
                SELECT DISTINCT ON (empresa_id) empresa_id, plan_id
                FROM pago_suscripcion
                WHERE estado IN ('PAGADO', 'COMPLETED')
                ORDER BY empresa_id, fecha_inicio_periodo DESC
            )
            SELECT p.nombre, COUNT(ls.empresa_id) as count
            FROM plan p
            LEFT JOIN LatestSubscription ls ON p.id = ls.plan_id
            GROUP BY p.nombre
            ORDER BY count DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            return [{"name": row['nombre'], "count": row['count']} for row in rows]
