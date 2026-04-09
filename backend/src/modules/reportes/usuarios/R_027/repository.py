from uuid import UUID
from typing import Dict, Any, List
from .....database.session import get_db
from fastapi import Depends

class RepositorioR027:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_datos_iva(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Obtiene datos de ventas clasificados por tarifa de IVA."""
        
        # Agrupación por tarifa de IVA (basado en el código del SRI en facturas_detalle)
        query_ventas = """
            SELECT 
                fd.tarifa_iva,
                SUM(fd.base_imponible) as base_imponible,
                SUM(fd.valor_iva) as valor_iva
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE f.empresa_id = %s 
              AND f.fecha_emision BETWEEN %s AND %s
              AND f.estado != 'ANULADA'
            GROUP BY fd.tarifa_iva
        """

        with self.db.cursor() as cur:
            cur.execute(query_ventas, (str(empresa_id), fecha_inicio, fecha_fin + " 23:59:59"))
            rows = cur.fetchall()
            
        return {
            "ventas_por_tarifa": [dict(row) for row in rows]
        }
