from uuid import UUID
from typing import List, Dict, Any, Optional
from .....database.session import get_db
from fastapi import Depends
from datetime import date

class RepositorioR001:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis_ventas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """KPIs principales de ventas: facturas emitidas, subtotales e IVA desglosado."""
        query = """
            SELECT
                COUNT(*) as facturas_emitidas,
                COALESCE(SUM(subtotal_sin_iva) FILTER (WHERE estado = 'AUTORIZADA'), 0) as subtotal_sin_iva,
                COALESCE(SUM(iva), 0) as iva_total,
                COALESCE(SUM(descuento), 0) as descuentos_totales,
                COALESCE(SUM(total), 0) as total_facturado,
                -- Cantidad de anuladas
                COALESCE(COUNT(*) FILTER (WHERE estado = 'ANULADA'), 0) as anuladas,
                -- Cantidad autorizadas (para el KPI principal)
                COALESCE(COUNT(*) FILTER (WHERE estado = 'AUTORIZADA'), 0) as facturas_validas
            FROM sistema_facturacion.facturas
            WHERE empresa_id = %s
              AND fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            if not row:
                return {
                    "facturas_emitidas": 0,
                    "subtotal_sin_iva": 0,
                    "iva_total": 0,
                    "descuentos_totales": 0,
                    "total_facturado": 0,
                    "anuladas": 0,
                    "facturas_validas": 0
                }
            return dict(row)

    def obtener_iva_desglosado(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> List[Dict[str, Any]]:
        """Desglose de IVA por tarifa (0%, 5%, 8%, 15%)."""
        query = """
            SELECT
                -- Determinar tarifa de acuerdo a los valores en la tabla
                CASE
                    WHEN (fd.tarifa_iva = 0 OR fd.tarifa_iva IS NULL) THEN '0%%'
                    WHEN fd.tarifa_iva = 5 THEN '5%%'
                    WHEN fd.tarifa_iva = 8 THEN '8%%'
                    WHEN fd.tarifa_iva = 15 THEN '15%%'
                    ELSE 'Otro'
                END as tarifa,
                COALESCE(SUM(fd.cantidad * fd.precio_unitario * (COALESCE(fd.tarifa_iva, 0) / 100)), 0) as iva_cobrado,
                COALESCE(SUM(fd.cantidad * fd.precio_unitario), 0) as base_imponible
            FROM sistema_facturacion.facturas f
            JOIN sistema_facturacion.facturas_detalle fd ON f.id = fd.factura_id
            WHERE f.empresa_id = %s
              AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
              AND f.estado = 'AUTORIZADA'
            GROUP BY CASE
                WHEN (fd.tarifa_iva = 0 OR fd.tarifa_iva IS NULL) THEN '0%%'
                WHEN fd.tarifa_iva = 5 THEN '5%%'
                WHEN fd.tarifa_iva = 8 THEN '8%%'
                WHEN fd.tarifa_iva = 15 THEN '15%%'
                ELSE 'Otro'
            END
            ORDER BY tarifa
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            return [dict(row) for row in cur.fetchall()]

    def obtener_ventas_por_usuario(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Detalle de ventas por usuario: facturas, total, ticket promedio, anuladas y devoluciones."""
        query = """
            SELECT
                u.nombres || ' ' || u.apellidos as usuario,
                COALESCE(COUNT(*) FILTER (WHERE f.estado = 'AUTORIZADA'), 0) as facturas_totales,
                COALESCE(SUM(f.total) FILTER (WHERE f.estado = 'AUTORIZADA'), 0) as total_ventas,
                CASE
                    WHEN COUNT(*) FILTER (WHERE f.estado = 'AUTORIZADA') > 0 THEN
                        ROUND(COALESCE(SUM(f.total) FILTER (WHERE f.estado = 'AUTORIZADA'), 0)::numeric / COUNT(*) FILTER (WHERE f.estado = 'AUTORIZADA'), 2)
                    ELSE 0
                END as ticket_promedio,
                COALESCE(COUNT(*) FILTER (WHERE f.estado = 'ANULADA'), 0) as anuladas,
                -- Devoluciones: notas crédito tipo '04'
                COALESCE(COUNT(*) FILTER (WHERE f.tipo_documento = '04'), 0) as devoluciones
            FROM sistema_facturacion.usuarios u
            LEFT JOIN sistema_facturacion.facturas f ON u.id = f.usuario_id
                AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
            WHERE u.empresa_id = %s
            GROUP BY u.id, u.nombres, u.apellidos
            ORDER BY total_ventas DESC
            LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (fecha_inicio, fecha_fin, str(empresa_id), limit))
            return [dict(row) for row in cur.fetchall()]

    def obtener_top_usuarios_ventas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Top 5 usuarios por volumen de ventas (para gráfica)."""
        query = """
            SELECT
                u.nombres || ' ' || u.apellidos as usuario,
                COALESCE(SUM(f.total) FILTER (WHERE f.estado = 'AUTORIZADA'), 0) as total_ventas,
                COALESCE(COUNT(*) FILTER (WHERE f.estado = 'AUTORIZADA'), 0) as facturas_validas
            FROM sistema_facturacion.usuarios u
            LEFT JOIN sistema_facturacion.facturas f ON u.id = f.usuario_id
                AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
            WHERE u.empresa_id = %s
            GROUP BY u.id, u.nombres, u.apellidos
            HAVING COALESCE(SUM(f.total), 0) > 0
            ORDER BY total_ventas DESC
            LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (fecha_inicio, fecha_fin, str(empresa_id), limit))
            return [dict(row) for row in cur.fetchall()]

    def obtener_ticket_promedio(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Calcula ticket promedio general vs período anterior."""
        # Período actual
        query_actual = """
            SELECT
                CASE
                    WHEN COUNT(*) FILTER (WHERE estado = 'AUTORIZADA') > 0 THEN
                        ROUND(COALESCE(SUM(total) FILTER (WHERE estado = 'AUTORIZADA'), 0)::numeric /
                              COUNT(*) FILTER (WHERE estado = 'AUTORIZADA'), 2)
                    ELSE 0
                END as ticket_promedio_actual,
                COUNT(*) FILTER (WHERE estado = 'AUTORIZADA') as facturas_validas
            FROM sistema_facturacion.facturas
            WHERE empresa_id = %s
              AND fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
        """

        with self.db.cursor() as cur:
            cur.execute(query_actual, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return dict(row) if row else {"ticket_promedio_actual": 0, "facturas_validas": 0}
