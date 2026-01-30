import json
from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioVendedores:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear(self, data: dict) -> Optional[dict]:
        if data.get('configuracion'): data['configuracion'] = json.dumps(data['configuracion'])
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO sistema_facturacion.vendedores ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = """
            SELECT v.*, u.email, u.ultimo_acceso,
                   COUNT(DISTINCT e.id) as empresas_asignadas,
                   COUNT(DISTINCT e.id) FILTER (WHERE e.activo = true) as empresas_activas,
                   COALESCE(SUM(p.monto), 0) as ingresos_generados
            FROM sistema_facturacion.vendedores v
            LEFT JOIN sistema_facturacion.users u ON u.id = v.user_id
            LEFT JOIN sistema_facturacion.empresas e ON e.vendedor_id = v.id
            LEFT JOIN sistema_facturacion.comisiones c ON c.vendedor_id = v.id
            LEFT JOIN sistema_facturacion.pagos_suscripciones p ON p.id = c.pago_suscripcion_id AND p.estado = 'PAGADO'
            WHERE v.id = %s
            GROUP BY v.id, u.email, u.ultimo_acceso
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_user_id(self, user_id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM sistema_facturacion.vendedores WHERE user_id = %s", (str(user_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_todos(self) -> List[dict]:
        query = """
            SELECT v.*, u.email, u.ultimo_acceso,
                   COUNT(DISTINCT e.id) as empresas_asignadas,
                   COUNT(DISTINCT e.id) FILTER (WHERE e.activo = true) as empresas_activas,
                   COALESCE(SUM(p.monto), 0) as ingresos_generados
            FROM sistema_facturacion.vendedores v
            LEFT JOIN sistema_facturacion.users u ON u.id = v.user_id
            LEFT JOIN sistema_facturacion.empresas e ON e.vendedor_id = v.id
            LEFT JOIN sistema_facturacion.comisiones c ON c.vendedor_id = v.id
            LEFT JOIN sistema_facturacion.pagos_suscripciones p ON p.id = c.pago_suscripcion_id AND p.estado = 'PAGADO'
            GROUP BY v.id, u.email, u.ultimo_acceso
            ORDER BY v.created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def obtener_stats_globales(self) -> dict:
        query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE activo = true) as activos,
                COUNT(*) FILTER (WHERE activo = false) as inactivos,
                (SELECT COUNT(*) FROM sistema_facturacion.empresas WHERE vendedor_id IS NOT NULL) as empresas_totales,
                COALESCE((
                    SELECT SUM(p.monto) 
                    FROM sistema_facturacion.pagos_suscripciones p
                    JOIN sistema_facturacion.comisiones c ON c.pago_suscripcion_id = p.id
                    WHERE p.estado = 'PAGADO'
                ), 0) as ingresos_generados
            FROM sistema_facturacion.vendedores
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            row = cur.fetchone()
            return dict(row) if row else {"total": 0, "activos": 0, "inactivos": 0, "empresas_totales": 0, "ingresos_generados": 0.0}

    def actualizar(self, id: UUID, data: dict) -> Optional[dict]:
        if data.get('configuracion') and isinstance(data['configuracion'], (dict, list)): 
            data['configuracion'] = json.dumps(data['configuracion'])
        
        set_clauses = [f"{k} = %s" for k in data.keys()]
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        values.append(str(id))
        query = f"UPDATE sistema_facturacion.vendedores SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def toggle_status(self, id: UUID) -> Optional[dict]:
        query = "UPDATE sistema_facturacion.vendedores SET activo = NOT activo, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def reasignar_empresas(self, from_vendedor_id: UUID, to_vendedor_id: UUID, empresa_ids: Optional[List[UUID]] = None) -> int:
        query = "UPDATE sistema_facturacion.empresas SET vendedor_id = %s, updated_at = NOW() WHERE vendedor_id = %s"
        params = [str(to_vendedor_id), str(from_vendedor_id)]
        
        if empresa_ids:
            placeholders = ", ".join(["%s"] * len(empresa_ids))
            query += f" AND id IN ({placeholders})"
            params.extend([str(eid) for eid in empresa_ids])
            
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(params))
            return cur.rowcount

    def eliminar(self, id: UUID) -> bool:
        query = "DELETE FROM sistema_facturacion.vendedores WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
