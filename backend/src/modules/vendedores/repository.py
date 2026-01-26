import json
from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioVendedores:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear(self, data: dict, password_hash: str) -> Optional[dict]:
        data['password_hash'] = password_hash
        if data.get('configuracion'): data['configuracion'] = json.dumps(data['configuracion'])
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO vendedor ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM vendedor WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_email(self, email: str) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM vendedor WHERE email = %s", (email,))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_todos(self) -> List[dict]:
        query = """
            SELECT v.*, 
                   COUNT(DISTINCT e.id) as empresas_asignadas,
                   COUNT(DISTINCT e.id) FILTER (WHERE e.activo = true) as empresas_activas,
                   COALESCE((
                       SELECT SUM(ps.monto)
                       FROM pago_suscripcion ps
                       JOIN empresa e2 ON ps.empresa_id = e2.id
                       WHERE e2.vendedor_id = v.id
                       AND ps.estado = 'PAGADO'
                   ), 0) as ingresos_generados
            FROM vendedor v
            LEFT JOIN empresa e ON e.vendedor_id = v.id
            GROUP BY v.id
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
                (SELECT COUNT(*) FROM empresa) as empresas_totales,
                COALESCE((
                    SELECT SUM(ps.monto)
                    FROM pago_suscripcion ps
                    JOIN empresa e ON ps.empresa_id = e.id
                    WHERE ps.estado = 'PAGADO'
                    AND e.vendedor_id IS NOT NULL
                ), 0) as ingresos_generados
            FROM vendedor
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            row = cur.fetchone()
            return dict(row) if row else {"total": 0, "activos": 0, "inactivos": 0, "empresas_totales": 0, "ingresos_generados": 0}

    def actualizar(self, id: UUID, data: dict) -> Optional[dict]:
        if data.get('configuracion') and isinstance(data['configuracion'], (dict, list)): 
            data['configuracion'] = json.dumps(data['configuracion'])
        
        set_clauses = [f"{k} = %s" for k in data.keys()]
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        values.append(str(id))
        query = f"UPDATE vendedor SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def toggle_status(self, id: UUID) -> Optional[dict]:
        query = "UPDATE vendedor SET activo = NOT activo, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def reasignar_empresas(self, from_vendedor_id: UUID, to_vendedor_id: UUID, empresa_ids: Optional[List[UUID]] = None) -> int:
        query = "UPDATE empresa SET vendedor_id = %s, updated_at = NOW() WHERE vendedor_id = %s"
        params = [str(to_vendedor_id), str(from_vendedor_id)]
        
        if empresa_ids:
            placeholders = ", ".join(["%s"] * len(empresa_ids))
            query += f" AND id IN ({placeholders})"
            params.extend([str(eid) for eid in empresa_ids])
            
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(params))
            return cur.rowcount

    def eliminar(self, id: UUID) -> bool:
        query = "DELETE FROM vendedor WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
