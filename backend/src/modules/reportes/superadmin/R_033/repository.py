from fastapi import Depends
from typing import Optional, List
from uuid import UUID
from datetime import date
from .....database.session import get_db

class RepositorioR033:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_uso_sistema_por_empresa(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> list:
        fi = fecha_inicio or date(date.today().year, date.today().month, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()
        query = """
            SELECT
                COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                
                -- Usuarios actuales (Activos/Reales)
                (SELECT COUNT(*) FROM sistema_facturacion.usuarios u_cnt 
                 WHERE u_cnt.empresa_id = e.id) as usuarios_activos,
                
                -- Límite del Plan
                p.max_usuarios as total_usuarios,
                
                -- Facturas en el periodo
                COALESCE((
                    SELECT COUNT(f.id)
                    FROM sistema_facturacion.facturas f
                    WHERE f.empresa_id = e.id
                      AND f.fecha_emision >= s.fecha_inicio
                      AND (s.fecha_fin IS NULL OR f.fecha_emision <= s.fecha_fin)
                      AND f.estado != 'ANULADA'
                ), 0) as facturas_mes,
                
                -- Límite de Facturas
                p.max_facturas_mes,
                
                -- Porcentaje de uso (Snapshot vs Límites del Plan)
                ROUND(GREATEST(
                    -- Porcentaje Facturas
                    CASE WHEN p.max_facturas_mes > 0 THEN 
                        (COALESCE((SELECT COUNT(f2.id) FROM sistema_facturacion.facturas f2 WHERE f2.empresa_id = e.id AND f2.fecha_emision >= s.fecha_inicio AND (s.fecha_fin IS NULL OR f2.fecha_emision <= s.fecha_fin) AND f2.estado != 'ANULADA'), 0)::numeric / p.max_facturas_mes * 100)
                    ELSE 0 END,
                    -- Porcentaje Usuarios
                    CASE WHEN p.max_usuarios > 0 THEN 
                        ((SELECT COUNT(*) FROM sistema_facturacion.usuarios u2 WHERE u2.empresa_id = e.id)::numeric / p.max_usuarios * 100)
                    ELSE 0 END,
                    -- Porcentaje Establecimientos
                    CASE WHEN p.max_establecimientos > 0 THEN 
                        ((SELECT COUNT(*) FROM sistema_facturacion.establecimientos est2 WHERE est2.empresa_id = e.id)::numeric / p.max_establecimientos * 100)
                    ELSE 0 END,
                    -- Porcentaje Programaciones
                    CASE WHEN p.max_programaciones > 0 THEN 
                        ((SELECT COUNT(*) FROM sistema_facturacion.facturacion_programada fp2 WHERE fp2.empresa_id = e.id AND fp2.activo = TRUE 
                          AND fp2.created_at >= s.fecha_inicio AND (s.fecha_fin IS NULL OR fp2.created_at <= s.fecha_fin))::numeric / p.max_programaciones * 100)
                    ELSE 0 END
                ), 1) as porcentaje_uso,

                -- Módulos usados
                (
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.establecimientos est WHERE est.empresa_id = e.id) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.productos prod WHERE prod.empresa_id = e.id) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.clientes cli WHERE cli.empresa_id = e.id) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.proveedores prov WHERE prov.empresa_id = e.id) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.facturas fac WHERE fac.empresa_id = e.id) THEN 1 ELSE 0 END)
                ) as modulos_usados,
                5 as modulos_total,
                
                COALESCE(p.nombre, 'Sin Plan') as plan_nombre,
                COALESCE(s.estado, 'SIN SUSCRIPCIÓN') as estado_suscripcion,
                (
                    SELECT MAX(usr.ultimo_acceso)
                    FROM sistema_facturacion.users usr
                    JOIN sistema_facturacion.usuarios usu ON usu.user_id = usr.id
                    WHERE usu.empresa_id = e.id
                ) as ultimo_acceso
            FROM sistema_facturacion.empresas e
            LEFT JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id 
            LEFT JOIN sistema_facturacion.planes p ON p.id = s.plan_id
            ORDER BY porcentaje_uso DESC NULLS LAST
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def obtener_modulos_mas_usados(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> list:
        """Distribución de uso de módulos como porcentaje sobre empresas activas."""
        fi = fecha_inicio or date(date.today().year, date.today().month, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()
        query = """
            WITH counts AS (
                SELECT modulo, COUNT(DISTINCT empresa_id) as empresas_usando
                FROM (
                    SELECT 'Facturación' as modulo, empresa_id FROM sistema_facturacion.facturas
                        WHERE fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                    UNION ALL SELECT 'Clientes', empresa_id FROM sistema_facturacion.clientes
                        WHERE created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                    UNION ALL SELECT 'Productos', empresa_id FROM sistema_facturacion.productos
                        WHERE created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                    UNION ALL SELECT 'Proveedores', empresa_id FROM sistema_facturacion.proveedores
                        WHERE created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                    UNION ALL SELECT 'Establecimientos', empresa_id FROM sistema_facturacion.establecimientos
                        WHERE created_at BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                ) datos
                GROUP BY modulo
            ),
            total_sum AS (
                SELECT SUM(empresas_usando) as gran_total FROM counts
            )
            SELECT 
                modulo, 
                empresas_usando,
                ROUND(empresas_usando::numeric / NULLIF((SELECT gran_total FROM total_sum), 0) * 100, 1) as porcentaje
            FROM counts
            ORDER BY empresas_usando DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (fi, ff, fi, ff, fi, ff, fi, ff, fi, ff))
            return [dict(row) for row in cur.fetchall()]

    def obtener_promedio_usuarios_por_empresa(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> dict:
        query = """
            SELECT
                ROUND(AVG(cnt), 1) as promedio_usuarios,
                MAX(cnt) as max_usuarios,
                MIN(cnt) as min_usuarios
            FROM (
                -- Usuarios registrados hasta la fecha fin del periodo
                SELECT e.id, COUNT(u.id) as cnt
                FROM sistema_facturacion.empresas e
                LEFT JOIN sistema_facturacion.usuarios u ON u.empresa_id = e.id
                    AND u.created_at <= %s::timestamp + interval '1 day'
                WHERE e.created_at <= %s::timestamp + interval '1 day'
                GROUP BY e.id
            ) sub
        """
        ff = fecha_fin or date.today().isoformat()
        with self.db.cursor() as cur:
            cur.execute(query, (ff, ff))
            row = cur.fetchone()
            return dict(row) if row else {}

    def obtener_top_empresas_usuarios(self, limit: int = 5) -> list:
        """Ranking de empresas con más usuarios (Top N)."""
        query = """
            SELECT 
                COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                COUNT(u.id) as total_usuarios
            FROM sistema_facturacion.empresas e
            JOIN sistema_facturacion.usuarios u ON u.empresa_id = e.id
            GROUP BY e.id, e.nombre_comercial, e.razon_social
            ORDER BY total_usuarios DESC
            LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (limit,))
            return [dict(row) for row in cur.fetchall()]
