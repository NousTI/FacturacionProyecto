from typing import List, Dict, Any
from .base import BaseRepository

class EmpresaRepository(BaseRepository):
    def obtener_consumo_plan(self, empresa_id: str) -> Dict[str, Any]:
        """Obtiene detalles de la suscripción y el consumo actual vs límite."""
        query = """
            SELECT p.nombre as plan_nombre, s.fecha_inicio, s.fecha_fin, s.estado as suscripcion_estado,
                COALESCE(p.max_facturas_mes, 0) as limite,
                (SELECT COUNT(*) FROM sistema_facturacion.facturas f 
                 WHERE f.empresa_id = s.empresa_id 
                 AND f.fecha_emision >= s.fecha_inicio 
                 AND (s.fecha_fin IS NULL OR f.fecha_emision <= s.fecha_fin)
                 AND f.estado != 'ANULADA') as actual
            FROM sistema_facturacion.suscripciones s
            JOIN sistema_facturacion.planes p ON s.plan_id = p.id
            WHERE s.empresa_id = %s ORDER BY s.updated_at DESC LIMIT 1
        """
        with self.db.cursor() as cur:
            cur.execute(query, (empresa_id,))
            res = cur.fetchone()
            if res:
                return {
                    "nombre_plan": res['plan_nombre'],
                    "fecha_inicio": res['fecha_inicio'].isoformat() if hasattr(res['fecha_inicio'], 'isoformat') else str(res['fecha_inicio']),
                    "fecha_vencimiento": res['fecha_fin'].isoformat() if hasattr(res['fecha_fin'], 'isoformat') else str(res['fecha_fin']),
                    "estado": res['suscripcion_estado'], "actual": res['actual'], "limite": res['limite']
                }
            return {"nombre_plan": "Sin Plan", "estado": "INACTIVA", "actual": 0, "limite": 0}

    def obtener_info_firma(self, empresa_id: str) -> Dict[str, Any]:
        """Obtiene días restantes y fecha de expiración de la firma."""
        query = """
            SELECT fecha_expiracion_cert as fecha, EXTRACT(DAY FROM (fecha_expiracion_cert - CURRENT_DATE)) as dias_restantes
            FROM sistema_facturacion.configuraciones_sri
            WHERE empresa_id = %s AND estado = 'ACTIVO' LIMIT 1
        """
        with self.db.cursor() as cur:
            cur.execute(query, (empresa_id,))
            res = cur.fetchone()
            if res:
                return {
                    "fecha": res['fecha'].isoformat() if hasattr(res['fecha'], 'isoformat') else str(res['fecha']),
                    "dias_restantes": int(res['dias_restantes']) if res['dias_restantes'] is not None else -1
                }
            return {"fecha": None, "dias_restantes": -1}

    def obtener_facturas_recientes(self, empresa_id: str, limite: int = 5) -> List[Dict[str, Any]]:
        """Obtiene las últimas facturas emitidas por la empresa."""
        query = """
            SELECT f.id, f.numero_factura as numero, c.razon_social as cliente, f.total, f.estado, f.fecha_emision as fecha
            FROM sistema_facturacion.facturas f
            JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
            WHERE f.empresa_id = %s ORDER BY f.fecha_emision DESC, f.created_at DESC LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (empresa_id, limite))
            return [
                {
                    "id": str(r['id']), "numero": r['numero'], "cliente": r['cliente'],
                    "total": float(r['total']), "estado": r['estado'],
                    "fecha": r['fecha'].isoformat() if hasattr(r['fecha'], 'isoformat') else str(r['fecha'])
                } for r in cur.fetchall()
            ]
