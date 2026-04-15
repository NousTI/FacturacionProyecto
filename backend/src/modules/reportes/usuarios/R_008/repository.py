from uuid import UUID
from typing import List, Optional, Dict, Any
from .....database.session import get_db
from fastapi import Depends

class RepositorioR008:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis_cartera(self, empresa_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> Dict[str, Any]:
        """KPIs principales de cuentas por cobrar con filtro de fechas."""
        query = """
            SELECT
                COALESCE(SUM(cc.saldo_pendiente), 0) as total_por_cobrar,
                COALESCE(SUM(cc.saldo_pendiente) FILTER (
                    WHERE cc.fecha_vencimiento < CURRENT_DATE
                      AND CURRENT_DATE - cc.fecha_vencimiento <= 30
                ), 0) as vencido_menor_30,
                COALESCE(SUM(cc.saldo_pendiente) FILTER (
                    WHERE cc.fecha_vencimiento < CURRENT_DATE
                      AND CURRENT_DATE - cc.fecha_vencimiento > 30
                ), 0) as cartera_critica
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            WHERE cc.empresa_id = %s AND cc.saldo_pendiente > 0 AND f.estado = 'AUTORIZADA'
        """
        params = [str(empresa_id)]

        if fecha_inicio:
            query += " AND f.fecha_emision >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND f.fecha_emision <= %s::timestamp + interval '1 day' - interval '1 second'"
            params.append(fecha_fin)

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            data = dict(row)

            # Cálculo de índice de morosidad
            total = float(data['total_por_cobrar'])
            critica = float(data['cartera_critica'])
            data['indice_morosidad'] = round((critica / total * 100), 2) if total > 0 else 0.0
            return data

    def obtener_top_clientes_pendientes(self, empresa_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Lista de facturas pendientes con saldo, una fila por factura."""
        query = """
            SELECT
                c.razon_social as cliente,
                f.numero_factura,
                ROUND(cc.saldo_pendiente::numeric, 2) as saldo_total,
                GREATEST(CURRENT_DATE - cc.fecha_vencimiento, 0) as dias_vencido,
                COALESCE(er.nombre, 'Sin rol') || ' / ' || COALESCE(u.nombres || ' ' || u.apellidos, 'No asignado') as responsable,
                CASE
                    WHEN CURRENT_DATE - cc.fecha_vencimiento > 30 THEN 'CRÍTICO'
                    WHEN CURRENT_DATE - cc.fecha_vencimiento > 0  THEN 'VENCIDO'
                    ELSE 'VIGENTE'
                END as estado
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.clientes c ON cc.cliente_id = c.id
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            LEFT JOIN sistema_facturacion.usuarios u ON f.usuario_id = u.id
            LEFT JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            WHERE cc.empresa_id = %s AND cc.saldo_pendiente > 0 AND f.estado = 'AUTORIZADA'
        """
        params = [str(empresa_id)]

        if fecha_inicio:
            query += " AND f.fecha_emision >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND f.fecha_emision <= %s::timestamp + interval '1 day' - interval '1 second'"
            params.append(fecha_fin)

        query += " ORDER BY dias_vencido DESC LIMIT %s"
        params.append(limit)

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]
