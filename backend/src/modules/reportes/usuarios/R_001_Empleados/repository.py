from uuid import UUID
from typing import List, Dict, Any
from .....database.session import get_db
from fastapi import Depends


class RepositorioR001Empleados:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis_propios(self, empresa_id: UUID, usuario_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """KPIs del empleado: solo sus facturas emitidas en el período."""
        query = """
            SELECT
                COALESCE(COUNT(*) FILTER (WHERE estado = 'AUTORIZADA'), 0) as mis_facturas,
                COALESCE(SUM(total) FILTER (WHERE estado = 'AUTORIZADA'), 0) as total_vendido,
                COALESCE(COUNT(*) FILTER (WHERE tipo_documento = '04'), 0) as devoluciones,
                CASE
                    WHEN COUNT(*) FILTER (WHERE estado = 'AUTORIZADA') > 0 THEN
                        ROUND(
                            COALESCE(SUM(total) FILTER (WHERE estado = 'AUTORIZADA'), 0)::numeric /
                            COUNT(*) FILTER (WHERE estado = 'AUTORIZADA'),
                        2)
                    ELSE 0
                END as ticket_promedio
            FROM sistema_facturacion.facturas
            WHERE empresa_id = %s
              AND usuario_id = %s
              AND fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), str(usuario_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return dict(row) if row else {
                "mis_facturas": 0, "total_vendido": 0,
                "devoluciones": 0, "ticket_promedio": 0
            }

    def obtener_facturas_recientes(self, empresa_id: UUID, usuario_id: UUID, fecha_inicio: str, fecha_fin: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Últimas facturas emitidas por el empleado en el período."""
        query = """
            SELECT
                f.numero_factura,
                c.razon_social as cliente,
                f.fecha_emision::date as fecha,
                f.total,
                f.estado
            FROM sistema_facturacion.facturas f
            JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
            WHERE f.empresa_id = %s
              AND f.usuario_id = %s
              AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
            ORDER BY f.fecha_emision DESC
            LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), str(usuario_id), fecha_inicio, fecha_fin, limit))
            return [dict(row) for row in cur.fetchall()]

    def obtener_mis_clientes(self, empresa_id: UUID, usuario_id: UUID, fecha_inicio: str, fecha_fin: str) -> List[Dict[str, Any]]:
        """Clientes a los que el empleado ha facturado en el período.
        Sin costos, sin márgenes, sin rentabilidad."""
        query = """
            SELECT
                c.razon_social as cliente,
                COUNT(*) FILTER (WHERE f.estado = 'AUTORIZADA') as facturas,
                COALESCE(SUM(f.total) FILTER (WHERE f.estado = 'AUTORIZADA'), 0) as total_compras,
                MAX(f.fecha_emision)::date as ultima_compra,
                CASE
                    WHEN MAX(f.fecha_emision) >= CURRENT_DATE - INTERVAL '60 days' THEN 'Activo'
                    ELSE 'Inactivo'
                END as estado
            FROM sistema_facturacion.facturas f
            JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
            WHERE f.empresa_id = %s
              AND f.usuario_id = %s
              AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
            GROUP BY c.id, c.razon_social
            ORDER BY total_compras DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), str(usuario_id), fecha_inicio, fecha_fin))
            return [dict(row) for row in cur.fetchall()]

    def obtener_nombre_empleado(self, usuario_id: UUID) -> str:
        """Nombre completo del empleado para el banner informativo."""
        query = """
            SELECT nombres || ' ' || apellidos as nombre_completo
            FROM sistema_facturacion.usuarios
            WHERE id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(usuario_id),))
            row = cur.fetchone()
            return row['nombre_completo'] if row else 'Usuario'
