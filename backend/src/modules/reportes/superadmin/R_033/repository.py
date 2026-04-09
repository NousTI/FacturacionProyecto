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
                COUNT(DISTINCT u.id) as total_usuarios,
                COUNT(DISTINCT CASE WHEN u.activo = TRUE THEN u.id END) as usuarios_activos,
                -- Facturas en el período seleccionado
                COALESCE((
                    SELECT COUNT(f.id)
                    FROM sistema_facturacion.facturas f
                    WHERE f.empresa_id = e.id
                      AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                      AND f.estado != 'ANULADA'
                ), 0) as facturas_mes,
                p.max_facturas_mes,
                -- Porcentaje de uso de facturas
                CASE
                    WHEN p.max_facturas_mes > 0 THEN
                        ROUND(
                            COALESCE((
                                SELECT COUNT(f.id)
                                FROM sistema_facturacion.facturas f
                                WHERE f.empresa_id = e.id
                                  AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                                  AND f.estado != 'ANULADA'
                            ), 0)::numeric / p.max_facturas_mes * 100, 1
                        )
                    ELSE 0
                END as porcentaje_uso,
                -- Módulos activos hasta la fecha fin
                (
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.establecimientos est WHERE est.empresa_id = e.id AND est.created_at <= %s::date) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.productos prod WHERE prod.empresa_id = e.id AND prod.created_at <= %s::date) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.clientes cli WHERE cli.empresa_id = e.id AND cli.created_at <= %s::date) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.proveedores prov WHERE prov.empresa_id = e.id AND prov.created_at <= %s::date) THEN 1 ELSE 0 END) +
                    (CASE WHEN EXISTS(SELECT 1 FROM sistema_facturacion.facturas fac WHERE fac.empresa_id = e.id AND fac.fecha_emision <= %s::date) THEN 1 ELSE 0 END)
                ) as modulos_usados,
                5 as modulos_total,
                p.nombre as plan_nombre,
                s.estado as estado_suscripcion,
                (
                    SELECT MAX(usr.ultimo_acceso)
                    FROM sistema_facturacion.users usr
                    JOIN sistema_facturacion.usuarios usu ON usu.user_id = usr.id
                    WHERE usu.empresa_id = e.id AND usr.ultimo_acceso <= %s::date
                ) as ultimo_acceso
            FROM sistema_facturacion.empresas e
            LEFT JOIN sistema_facturacion.usuarios u ON u.empresa_id = e.id AND u.created_at <= %s::date
            LEFT JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id 
                AND s.fecha_inicio <= %s::date AND s.fecha_fin >= %s::date
            LEFT JOIN sistema_facturacion.planes p ON p.id = s.plan_id
            WHERE e.created_at <= %s::date
            GROUP BY e.id, e.nombre_comercial, e.razon_social, p.nombre, p.max_facturas_mes, s.estado
            ORDER BY porcentaje_uso DESC NULLS LAST
        """
        with self.db.cursor() as cur:
            cur.execute(query, (
                fi, ff,       # facturas_mes
                fi, ff,       # porcentaje_uso
                ff, ff, ff, ff, ff, # modulos_usados (5 EXISTS)
                ff,           # ultimo_acceso
                ff,           # usuarios join
                ff, ff,       # suscripciones join (inicio/fin)
                ff            # empresas where
            ))
            return [dict(row) for row in cur.fetchall()]

    def obtener_modulos_mas_usados(self, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> list:
        """Distribución de uso de módulos como porcentaje sobre empresas activas."""
        fi = fecha_inicio or date(date.today().year, date.today().month, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()
        query = """
            WITH empresas_activas AS (
                SELECT COUNT(DISTINCT e.id) as total
                FROM sistema_facturacion.empresas e
                JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                WHERE s.fecha_inicio <= %s::date AND s.fecha_fin >= %s::date
                  AND e.created_at <= %s::date
            )
            SELECT modulo, COUNT(DISTINCT empresa_id) as empresas_usando,
                   ROUND(COUNT(DISTINCT empresa_id)::numeric / NULLIF((SELECT total FROM empresas_activas), 0) * 100, 1) as porcentaje
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
            ORDER BY empresas_usando DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (ff, ff, ff, fi, ff, fi, ff, fi, ff, fi, ff, fi, ff))
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
