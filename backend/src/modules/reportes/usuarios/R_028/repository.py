from uuid import UUID
from typing import Dict, Any
from .....database.session import get_db
from fastapi import Depends

class RepositorioR028:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_kpis_ventas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Obtiene indicadores clave de ventas."""
        query = """
            SELECT 
                COALESCE(SUM(total), 0) as total_facturado,
                COUNT(*) as facturas_emitidas,
                COUNT(DISTINCT cliente_id) as clientes_activos
            FROM sistema_facturacion.facturas
            WHERE empresa_id = %s 
              AND fecha_emision BETWEEN %s AND %s
              AND estado != 'ANULADA'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            return dict(cur.fetchone())

    def obtener_kpis_cobros(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Obtiene indicadores clave de cobranzas."""
        # Total cobrado en el periodo (de cualquier factura)
        query_cobrado = """
            SELECT COALESCE(SUM(monto), 0) as total_cobrado
            FROM sistema_facturacion.pagos_factura pf
            JOIN sistema_facturacion.cuentas_cobrar cc ON pf.cuenta_cobrar_id = cc.id
            JOIN sistema_facturacion.facturas f ON cc.factura_id = f.id
            WHERE f.empresa_id = %s 
              AND pf.fecha_pago BETWEEN %s AND %s
        """
        
        # Pendiente de cobro (saldo actual total de la empresa en ese periodo)
        query_pendiente = """
            SELECT COALESCE(SUM(saldo_pendiente), 0) as total_pendiente
            FROM sistema_facturacion.cuentas_cobrar
            WHERE empresa_id = %s 
              AND estado != 'pagado'
              AND fecha_emision BETWEEN %s AND %s
        """
        
        with self.db.cursor() as cur:
            cur.execute(query_cobrado, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            cobrado = cur.fetchone()['total_cobrado']
            
            cur.execute(query_pendiente, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            pendiente = cur.fetchone()['total_pendiente']
            
        return {
            "total_cobrado": float(cobrado),
            "total_pendiente": float(pendiente)
        }
