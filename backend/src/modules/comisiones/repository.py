from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioComisiones:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_comisiones(self, vendedor_id: Optional[UUID] = None) -> List[dict]:
        query = """
            SELECT c.*, v.nombres || ' ' || v.apellidos as vendedor_nombre,
                   e.nombre_comercial as empresa_nombre, p.monto as monto_pago,
                   sa.email as aprobado_por_nombre
            FROM comision c
            LEFT JOIN vendedor v ON c.vendedor_id = v.id
            LEFT JOIN pago_suscripcion p ON c.pago_suscripcion_id = p.id
            LEFT JOIN empresa e ON p.empresa_id = e.id
            LEFT JOIN superadmin sa ON c.aprobado_por = sa.id
        """
        params = []
        if vendedor_id:
            query += " WHERE c.vendedor_id = %s"
            params.append(str(vendedor_id))
        query += " ORDER BY c.created_at DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_stats(self, vendedor_id: Optional[UUID] = None) -> dict:
        query = """
            SELECT 
                COALESCE(SUM(monto), 0) as total,
                COALESCE(SUM(CASE WHEN estado = 'PENDIENTE' THEN monto ELSE 0 END), 0) as pendientes,
                COALESCE(SUM(CASE WHEN estado = 'PAGADA' THEN monto ELSE 0 END), 0) as pagados
            FROM comision
        """
        params = []
        if vendedor_id:
            query += " WHERE vendedor_id = %s"
            params.append(str(vendedor_id))
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return dict(cur.fetchone())

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = """
            SELECT c.*, v.nombres || ' ' || v.apellidos as vendedor_nombre,
                   v.nombres as vendedor_nombres, v.apellidos as vendedor_apellidos,
                   v.documento_identidad, v.telefono, v.email as vendedor_email,
                   e.nombre_comercial as empresa_nombre, p.monto as monto_pago,
                   sa.email as aprobado_por_nombre 
            FROM comision c
            LEFT JOIN vendedor v ON c.vendedor_id = v.id
            LEFT JOIN pago_suscripcion p ON c.pago_suscripcion_id = p.id
            LEFT JOIN empresa e ON p.empresa_id = e.id
            LEFT JOIN superadmin sa ON c.aprobado_por = sa.id
            WHERE c.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def contar_pagos_previos_empresa(self, empresa_id: UUID) -> int:
        query = "SELECT COUNT(*) as total FROM pago_suscripcion WHERE empresa_id = %s AND estado IN ('COMPLETED', 'PAGADO')"
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return row['total'] if row else 0

    def crear_comision(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO comision ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_comision(self, id: UUID, data: dict) -> Optional[dict]:
        set_clauses = [f"{k} = %s" for k in data.keys()]
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        values.append(str(id))
        query = f"UPDATE comision SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_comision(self, id: UUID) -> bool:
        query = "DELETE FROM comision WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
