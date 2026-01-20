from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from datetime import date
import json
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioSuscripciones:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    # --- Planes ---
    def listar_planes(self) -> List[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM plan ORDER BY orden ASC")
            return [dict(row) for row in cur.fetchall()]

    def obtener_plan_por_id(self, id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM plan WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear_plan(self, data: dict) -> Optional[dict]:
        if 'caracteristicas' in data: data['caracteristicas'] = json.dumps(data['caracteristicas'])
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO plan ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    # --- Suscripciones / Pagos ---
    def registrar_suscripcion_atomica(self, pago_data: dict, empresa_data: dict, comision_data: Optional[dict]):
        with db_transaction(self.db) as cur:
            # 1. Pago
            p_fields = list(pago_data.keys())
            p_values = [str(v) if isinstance(v, UUID) else v for v in pago_data.values()]
            cur.execute(f"INSERT INTO pago_suscripcion ({', '.join(p_fields)}) VALUES ({', '.join(['%s']*len(p_fields))}) RETURNING id", tuple(p_values))
            pago_id = cur.fetchone()['id']

            # 2. Empresa
            cur.execute("""
                UPDATE empresa SET fecha_activacion = %s, fecha_vencimiento = %s, estado_suscripcion = %s, updated_at = NOW()
                WHERE id = %s
            """, (empresa_data['fecha_activacion'], empresa_data['fecha_vencimiento'], empresa_data['estado'], str(empresa_data['id'])))

            # 3. Comision
            if comision_data:
                comision_data['pago_suscripcion_id'] = str(pago_id)
                c_fields = list(comision_data.keys())
                cur.execute(f"INSERT INTO comision ({', '.join(c_fields)}) VALUES ({', '.join(['%s']*len(c_fields))})", tuple(comision_data.values()))
            
            return pago_id

    def listar_pagos(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        query = "SELECT p.*, e.razon_social as empresa_nombre, pl.nombre as plan_nombre FROM pago_suscripcion p " \
                "JOIN empresa e ON p.empresa_id = e.id JOIN plan pl ON p.plan_id = pl.id"
        params = []
        if empresa_id:
            query += " WHERE p.empresa_id = %s"
            params.append(str(empresa_id))
        query += " ORDER BY p.fecha_pago DESC"
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]
