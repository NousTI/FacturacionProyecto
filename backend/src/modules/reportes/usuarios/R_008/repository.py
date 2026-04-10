from uuid import UUID
from typing import List, Optional, Dict, Any
from .....database.session import get_db
from fastapi import Depends

class RepositorioR008:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis_cartera(self, empresa_id: UUID) -> Dict[str, Any]:
        """KPIs principales de cuentas por cobrar."""
        query = """
            SELECT 
                COALESCE(SUM(saldo_pendiente), 0) as total_por_cobrar,
                COALESCE(SUM(saldo_pendiente) FILTER (WHERE CURRENT_DATE - fecha_vencimiento < 30), 0) as vencido_menor_30,
                COALESCE(SUM(saldo_pendiente) FILTER (WHERE CURRENT_DATE - fecha_vencimiento >= 30), 0) as cartera_critica
            FROM sistema_facturacion.cuentas_cobrar
            WHERE empresa_id = %s AND saldo_pendiente > 0
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            data = dict(row)
            
            # Cálculo de índice de morosidad
            total = float(data['total_por_cobrar'])
            critica = float(data['cartera_critica'])
            data['indice_morosidad'] = round((critica / total * 100), 2) if total > 0 else 0.0
            return data

    def obtener_top_clientes_pendientes(self, empresa_id: UUID, limit: int = 10) -> List[Dict[str, Any]]:
        """Top clientes con saldo pendiente y antigüedad."""
        query = """
            SELECT 
                c.razon_social as cliente,
                SUM(cc.saldo_pendiente) as saldo_total,
                MAX(CURRENT_DATE - cc.fecha_vencimiento) as dias_vencido,
                COUNT(*) as facturas_pendientes,
                COALESCE(u.nombres || ' ' || u.apellidos, 'No asignado') as responsable,
                CASE 
                    WHEN MAX(CURRENT_DATE - cc.fecha_vencimiento) >= 30 THEN 'CRÍTICO'
                    ELSE 'VENCIDO'
                END as estado
            FROM sistema_facturacion.cuentas_cobrar cc
            JOIN sistema_facturacion.clientes c ON cc.cliente_id = c.id
            LEFT JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            LEFT JOIN sistema_facturacion.usuarios u ON f.usuario_id = u.id
            WHERE cc.empresa_id = %s AND cc.saldo_pendiente > 0
            GROUP BY c.id, c.razon_social, u.nombres, u.apellidos
            ORDER BY saldo_total DESC
            LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), limit))
            return [dict(row) for row in cur.fetchall()]
