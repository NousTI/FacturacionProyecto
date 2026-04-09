from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from .....database.session import get_db

class RepositorioRV001:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def obtener_empresas_vendedor_detalle(self, vendedor_id: UUID, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> List[dict]:
        query = """
            SELECT 
                e.ruc, 
                e.razon_social, 
                e.nombre_comercial,
                e.email,
                e.activo,
                TO_CHAR(e.created_at, 'YYYY-MM-DD') as fecha_registro,
                COUNT(u.id) as usuarios_registrados
            FROM sistema_facturacion.empresas e
            LEFT JOIN sistema_facturacion.usuarios u ON e.id = u.empresa_id
            WHERE e.vendedor_id = %s
        """
        params = [str(vendedor_id)]

        if fecha_inicio:
            query += " AND e.created_at >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND e.created_at <= %s"
            params.append(fecha_fin + " 23:59:59")

        query += """
            GROUP BY e.id
            ORDER BY e.created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]
