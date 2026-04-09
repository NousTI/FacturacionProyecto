from fastapi import Depends
from typing import List
from uuid import UUID
from .....database.session import get_db

class RepositorioRV002:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_suscripciones_vencidas(self, vendedor_id: UUID) -> List[dict]:
        query = """
            SELECT e.razon_social, e.ruc, e.telefono, e.email, s.fecha_fin, p.nombre as plan_nombre
            FROM sistema_facturacion.suscripciones s
            JOIN sistema_facturacion.empresas e ON s.empresa_id = e.id
            JOIN sistema_facturacion.planes p ON s.plan_id = p.id
            WHERE e.vendedor_id = %s AND s.estado IN ('VENCIDA', 'SUSPENDIDA')
            ORDER BY s.fecha_fin DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(vendedor_id),))
            return [dict(row) for row in cur.fetchall()]
