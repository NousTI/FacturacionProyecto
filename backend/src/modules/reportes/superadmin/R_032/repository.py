from fastapi import Depends
from typing import Optional, List
from uuid import UUID
from datetime import date
from .....database.session import get_db

class RepositorioR032:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis_comisiones_superadmin(
        self,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None,
        vendedor_id: Optional[str] = None,
        estado: Optional[str] = None
    ) -> dict:
        query = """
            SELECT
                -- Comisiones pendientes acumuladas hasta la fecha seleccionada
                (SELECT COALESCE(SUM(c1.monto), 0)
                 FROM sistema_facturacion.comisiones c1
                 WHERE c1.estado = 'PENDIENTE'
                   AND c1.fecha_generacion <= {f_fin}
                   {v_filter_c1}) as comisiones_pendientes,

                -- Comisiones pagadas en el período
                (SELECT COALESCE(SUM(c2.monto), 0)
                 FROM sistema_facturacion.comisiones c2
                 WHERE c2.estado = 'PAGADA'
                   AND c2.fecha_pago BETWEEN {f_inicio} AND {f_fin}
                   {v_filter_c2}) as pagadas_mes,

                -- Vendedores activos en el periodo
                (SELECT COUNT(v3.id) FROM sistema_facturacion.vendedores v3 
                 WHERE v3.activo = TRUE 
                   AND v3.created_at <= {f_fin}
                   {v_filter_v3}) as vendedores_activos,

                -- Upgrades concretados
                (SELECT ROUND(
                    COUNT(DISTINCT ps.empresa_id)::numeric /
                    NULLIF((SELECT COUNT(DISTINCT ps3.empresa_id) FROM sistema_facturacion.pagos_suscripciones ps3 JOIN sistema_facturacion.empresas emp3 ON emp3.id = ps3.empresa_id WHERE ps3.estado='PAGADO' AND ps3.fecha_pago <= {f_fin} {v_filter_ps3}), 0) * 100, 1
                 )
                 FROM sistema_facturacion.pagos_suscripciones ps
                 JOIN sistema_facturacion.empresas emp_up ON emp_up.id = ps.empresa_id
                 WHERE ps.estado = 'PAGADO'
                   AND ps.fecha_pago BETWEEN {f_inicio} AND {f_fin}
                   {v_filter_ps}
                   AND EXISTS (
                       SELECT 1 FROM sistema_facturacion.pagos_suscripciones ps2
                       WHERE ps2.empresa_id = ps.empresa_id
                         AND ps2.plan_id != ps.plan_id
                         AND ps2.fecha_pago < ps.fecha_pago
                   )) as porcentaje_upgrades,

                -- Clientes perdidos
                (SELECT ROUND(
                    (SELECT COUNT(DISTINCT e.id)
                     FROM sistema_facturacion.empresas e
                     JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                     WHERE s.estado IN ('VENCIDA','SUSPENDIDA') AND e.activo = FALSE
                     {v_filter_e})::numeric /
                    NULLIF((SELECT COUNT(id) FROM sistema_facturacion.empresas e2 WHERE 1=1 AND e2.created_at <= {f_fin} {v_filter_e2}), 0) * 100, 1
                )) as porcentaje_clientes_perdidos
        """
        fi = fecha_inicio or date(date.today().year, date.today().month, 1).isoformat()
        ff = fecha_fin or date.today().isoformat()

        f_inicio = "%s"
        f_fin = "%s::timestamp + interval '1 day' - interval '1 second'"
        v_filter_c1 = " AND c1.vendedor_id = %s" if vendedor_id else ""
        v_filter_c2 = " AND c2.vendedor_id = %s" if vendedor_id else ""
        v_filter_v3 = " AND v3.id = %s" if vendedor_id else ""
        v_filter_ps = " AND emp_up.vendedor_id = %s" if vendedor_id else ""
        v_filter_ps3 = " AND emp3.vendedor_id = %s" if vendedor_id else ""
        v_filter_e  = " AND e.vendedor_id = %s" if vendedor_id else ""
        v_filter_e2 = " AND e2.vendedor_id = %s" if vendedor_id else ""

        query = query.format(
            f_inicio=f_inicio,
            f_fin=f_fin,
            v_filter_c1=v_filter_c1,
            v_filter_c2=v_filter_c2,
            v_filter_v3=v_filter_v3,
            v_filter_ps=v_filter_ps,
            v_filter_ps3=v_filter_ps3,
            v_filter_e=v_filter_e,
            v_filter_e2=v_filter_e2
        )

        # Orden de parámetros según la query:
        # c1: ff [, vid]
        # c2: fi, ff [, vid]
        # v3: ff [, vid]
        # ps3: ff [, vid]
        # ps: fi, ff [, vid]
        # e2: ff [, vid]
        params: list = []
        params.append(ff)
        if vendedor_id: params.append(vendedor_id)
        params += [fi, ff]
        if vendedor_id: params.append(vendedor_id)
        params.append(ff)
        if vendedor_id: params.append(vendedor_id)
        params.append(ff)
        if vendedor_id: params.append(vendedor_id)
        params += [fi, ff]
        if vendedor_id: params.append(vendedor_id)
        params.append(ff)
        if vendedor_id: params.append(vendedor_id)

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            return dict(row) if row else {}

    def obtener_detalle_comisiones_superadmin(
        self,
        vendedor_id: Optional[str] = None,
        estado: Optional[str] = None,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None
    ) -> list:
        query = """
            SELECT
                v.nombres || ' ' || v.apellidos as vendedor,
                COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                -- Tipo de venta: NUEVA si no hay pagos anteriores, RENOVACION si hay, UPGRADE si cambió de plan
                CASE
                    WHEN NOT EXISTS (
                        SELECT 1 FROM sistema_facturacion.pagos_suscripciones ps_prev
                        WHERE ps_prev.empresa_id = ps.empresa_id AND ps_prev.fecha_pago < ps.fecha_pago
                    ) THEN 'Nueva'
                    WHEN EXISTS (
                        SELECT 1 FROM sistema_facturacion.pagos_suscripciones ps_prev2
                        WHERE ps_prev2.empresa_id = ps.empresa_id
                          AND ps_prev2.plan_id != ps.plan_id
                          AND ps_prev2.fecha_pago < ps.fecha_pago
                    ) THEN 'Upgrade'
                    ELSE 'Renovación'
                END as tipo_venta,
                p.nombre as plan,
                c.monto as comision,
                c.estado,
                TO_CHAR(c.fecha_generacion, 'YYYY-MM-DD') as fecha
            FROM sistema_facturacion.comisiones c
            JOIN sistema_facturacion.vendedores v ON v.id = c.vendedor_id
            JOIN sistema_facturacion.pagos_suscripciones ps ON ps.id = c.pago_suscripcion_id
            JOIN sistema_facturacion.empresas e ON e.id = ps.empresa_id
            JOIN sistema_facturacion.planes p ON p.id = ps.plan_id
            WHERE 1=1
        """
        params = []
        if vendedor_id:
            query += " AND c.vendedor_id = %s"
            params.append(vendedor_id)
        if estado:
            query += " AND c.estado = %s"
            params.append(estado)
        if fecha_inicio:
            query += " AND c.fecha_generacion >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND c.fecha_generacion <= %s::timestamp + interval '1 day' - interval '1 second'"
            params.append(fecha_fin)
        query += " ORDER BY c.fecha_generacion DESC"
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]
