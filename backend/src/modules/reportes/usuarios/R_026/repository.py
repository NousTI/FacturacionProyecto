from uuid import UUID
from typing import Dict, Any, Optional
from datetime import datetime
from .....database.session import get_db
from fastapi import Depends

class RepositorioR026:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_pyg_data(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Obtiene datos de ingresos y costos para el Estado de Resultados."""
        
        # 1. Ingresos y Descuentos
        query_ingresos = """
            SELECT 
                COALESCE(SUM(subtotal_sin_iva + subtotal_con_iva + subtotal_no_objeto_iva + subtotal_exento_iva), 0) as ventas,
                COALESCE(SUM(descuento), 0) as descuentos
            FROM sistema_facturacion.facturas
            WHERE empresa_id = %s 
              AND fecha_emision BETWEEN %s AND %s
              AND estado != 'ANULADA'
        """
        
        # 2. Costo de Ventas (calculado desde el detalle que guarda el costo unitario al momento de venta)
        query_costo = """
            SELECT 
                COALESCE(SUM(fd.cantidad * COALESCE(fd.costo_unitario, p.costo, 0)), 0) as costo_total
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            LEFT JOIN sistema_facturacion.productos p ON fd.producto_id = p.id
            WHERE f.empresa_id = %s 
              AND f.fecha_emision BETWEEN %s AND %s
              AND f.estado != 'ANULADA'
        """

        with self.db.cursor() as cur:
            cur.execute(query_ingresos, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            ingresos = dict(cur.fetchone())
            
            cur.execute(query_costo, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            costos = dict(cur.fetchone())
            
        return {
            "ingresos": ingresos,
            "costos": costos
        }
