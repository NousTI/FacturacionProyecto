from fastapi import Depends
from uuid import UUID
from .....database.session import get_db

class RepositorioDashboardVendedor:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_metricas(self, vendedor_id: UUID) -> dict:
        query = """
            SELECT 
                COUNT(DISTINCT e.id) as total_empresas,
                COALESCE(COUNT(DISTINCT CASE WHEN e.activo = TRUE THEN e.id END), 0) as empresas_activas,
                COUNT(u.id) as total_usuarios,
                COALESCE(COUNT(CASE WHEN u.activo = TRUE THEN u.id END), 0) as usuarios_activos
            FROM sistema_facturacion.empresas e
            LEFT JOIN sistema_facturacion.usuarios u ON e.id = u.empresa_id
            WHERE e.vendedor_id = %s
        """
        
        query_crecimiento = """
            SELECT 
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as mes,
                COUNT(id) as nuevas_empresas
            FROM sistema_facturacion.empresas
            WHERE vendedor_id = %s AND created_at >= NOW() - INTERVAL '6 months'
            GROUP BY 1 ORDER BY 1 ASC
        """
        
        query_extras = """
            SELECT
                (SELECT COUNT(s.id) FROM sistema_facturacion.suscripciones s
                 JOIN sistema_facturacion.empresas e ON s.empresa_id = e.id
                 WHERE e.vendedor_id = %s AND s.estado IN ('VENCIDA', 'SUSPENDIDA')) as total_vencidas,
                 
                (SELECT COUNT(s.id) FROM sistema_facturacion.suscripciones s
                 JOIN sistema_facturacion.empresas e ON s.empresa_id = e.id
                 WHERE e.vendedor_id = %s 
                   AND s.estado = 'ACTIVA' 
                   AND s.fecha_fin BETWEEN NOW() AND NOW() + INTERVAL '15 days') as total_proximas,
                   
                (SELECT COALESCE(SUM(c.monto), 0) FROM sistema_facturacion.comisiones c
                 WHERE c.vendedor_id = %s) as monto_comisiones,
                 
                (SELECT COALESCE(SUM(c.monto), 0) FROM sistema_facturacion.comisiones c
                 WHERE c.vendedor_id = %s 
                   AND DATE_TRUNC('month', c.fecha_generacion) = DATE_TRUNC('month', NOW())) as comisiones_mes,
                   
                (SELECT COUNT(e.id) FROM sistema_facturacion.empresas e
                 WHERE e.vendedor_id = %s AND e.activo = FALSE) as empresas_inactivas
        """
        
        with self.db.cursor() as cur:
            cur.execute(query, (str(vendedor_id),))
            row = cur.fetchone()
            metricas = dict(row) if row else {"total_empresas": 0, "empresas_activas": 0, "total_usuarios": 0, "usuarios_activos": 0}
            
            params_extras = (
                str(vendedor_id), str(vendedor_id), str(vendedor_id), 
                str(vendedor_id), str(vendedor_id)
            )
            cur.execute(query_extras, params_extras)
            row_extras = cur.fetchone()
            if row_extras:
                metricas.update(dict(row_extras))
            else:
                metricas.update({"total_vencidas": 0, "total_proximas": 0, "monto_comisiones": 0.0, "comisiones_mes": 0.0, "empresas_inactivas": 0})
            
            cur.execute(query_crecimiento, (str(vendedor_id),))
            metricas['tendencia_crecimiento'] = [dict(r) for r in cur.fetchall()]
            
            return metricas
