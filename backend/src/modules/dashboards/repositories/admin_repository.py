from typing import List, Dict, Any
from .base import BaseRepository

class AdminRepository(BaseRepository):
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

            cur.execute("SELECT COUNT(*) as count FROM sistema_facturacion.facturas WHERE estado != 'ANULADA'")
            stats['total_facturas'] = cur.fetchone()['count']

            cur.execute("""
                SELECT COUNT(*) as count FROM sistema_facturacion.autorizaciones_sri 
                WHERE estado = 'RECHAZADO' AND created_at > CURRENT_DATE - INTERVAL '24 hours'
            """)
            stats['errores_sri_count'] = cur.fetchone()['count']

            cur.execute("""
                SELECT COUNT(*) as count FROM sistema_facturacion.configuraciones_sri 
                WHERE fecha_expiracion_cert <= CURRENT_DATE + INTERVAL '10 days' AND estado = 'ACTIVO'
            """)
            stats['certificados_vencer'] = cur.fetchone()['count']
        return stats

    def obtener_empresas_recientes(self, limite: int = 5) -> List[Dict[str, Any]]:
        query = """
            SELECT e.id, e.nombre_comercial, e.activo, e.created_at as fecha_registro, p.nombre as plan_nombre
            FROM sistema_facturacion.empresas e
            LEFT JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id AND s.estado = 'ACTIVA'
            LEFT JOIN sistema_facturacion.planes p ON s.plan_id = p.id
            ORDER BY e.created_at DESC LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (limite,))
            return [dict(r) for r in cur.fetchall()]

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

    def obtener_pagos_atrasados(self) -> int:
        with self.db.cursor() as cur:
             cur.execute("""
                SELECT COUNT(*) as count 
                FROM sistema_facturacion.empresas e
                JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id
                WHERE s.fecha_fin < CURRENT_DATE AND e.activo = true AND s.estado = 'ACTIVA'
            """)
             return cur.fetchone()['count']
