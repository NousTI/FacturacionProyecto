from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from .....database.session import get_db

class RepositorioRV004:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_comisiones_mes(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        query = """
            SELECT 
                e.razon_social, c.monto, c.porcentaje_aplicado, c.estado, 
                TO_CHAR(c.fecha_generacion, 'YYYY-MM-DD') as fecha_generacion,
                p.nombre as plan_nombre
            FROM sistema_facturacion.comisiones c
            JOIN sistema_facturacion.pagos_suscripciones ps ON c.pago_suscripcion_id = ps.id
            JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
            JOIN sistema_facturacion.planes p ON ps.plan_id = p.id
            WHERE c.vendedor_id = %s
        """
        params = [str(vendedor_id)]

        if fecha_inicio:
            query += " AND c.fecha_generacion >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND c.fecha_generacion <= %s"
            params.append(fecha_fin + " 23:59:59")

        query += " ORDER BY c.fecha_generacion DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]
