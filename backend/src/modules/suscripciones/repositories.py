from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime
import json
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioSuscripciones:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    # --- Planes ---
    def listar_planes(self) -> List[dict]:
        with self.db.cursor() as cur:
            query = """
                SELECT p.*,
                (
                    SELECT COUNT(DISTINCT s.empresa_id)
                    FROM sistema_facturacion.suscripciones s
                    WHERE s.plan_id = p.id
                    AND s.estado = 'ACTIVA'
                    AND s.fecha_fin >= CURRENT_DATE
                ) as active_companies
                FROM sistema_facturacion.planes p
                ORDER BY p.precio_mensual ASC
            """
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def obtener_plan_por_id(self, id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM sistema_facturacion.planes WHERE id = %s", (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear_plan(self, data: dict) -> Optional[dict]:
        if 'caracteristicas' in data:
            if hasattr(data['caracteristicas'], 'model_dump_json'):
                data['caracteristicas'] = data['caracteristicas'].model_dump_json()
            elif isinstance(data['caracteristicas'], dict):
                data['caracteristicas'] = json.dumps(data['caracteristicas'])
                
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO sistema_facturacion.planes ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_plan(self, id: UUID, data: dict) -> Optional[dict]:
        if 'caracteristicas' in data:
            if hasattr(data['caracteristicas'], 'model_dump_json'):
                data['caracteristicas'] = data['caracteristicas'].model_dump_json()
            elif isinstance(data['caracteristicas'], dict):
                data['caracteristicas'] = json.dumps(data['caracteristicas'])

        fields = [f"{k} = %s" for k in data.keys()]
        values = list(data.values())
        values.append(str(id))
        query = f"UPDATE sistema_facturacion.planes SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_plan(self, id: UUID) -> bool:
        # Check if plan has subscribers before deleting (logic could be soft delete too)
        with db_transaction(self.db) as cur:
            cur.execute("DELETE FROM sistema_facturacion.planes WHERE id = %s", (str(id),))
            return cur.rowcount > 0

    def listar_empresas_por_plan(self, plan_id: UUID, vendedor_id: Optional[UUID] = None) -> List[dict]:
        query = """
            SELECT e.id, e.razon_social, e.nombre_comercial, e.ruc, e.email, e.telefono, 
                   s.fecha_inicio as fecha_activacion, s.fecha_fin as fecha_vencimiento, 
                   e.activo, e.created_at
            FROM sistema_facturacion.empresas e
            JOIN sistema_facturacion.suscripciones s ON e.id = s.empresa_id
            WHERE s.plan_id = %s
            AND s.estado = 'ACTIVA'
            AND s.fecha_fin >= CURRENT_DATE
        """
        params = [str(plan_id)]
        
        if vendedor_id:
            query += " AND e.vendedor_id = %s"
            params.append(str(vendedor_id))
            
        query += " ORDER BY s.fecha_inicio DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    # --- Suscripciones / Pagos ---
    def registrar_suscripcion_atomica(self, pago_data: dict, empresa_data: dict, comision_data: Optional[dict]):
        with db_transaction(self.db) as cur:
            # 0. Obtener estado anterior para el log
            cur.execute("""
                SELECT id, plan_id, fecha_inicio, fecha_fin, estado 
                FROM sistema_facturacion.suscripciones 
                WHERE empresa_id = %s
            """, (str(empresa_data['id']),))
            old_s = cur.fetchone()

            # 1. Pago
            p_fields = list(pago_data.keys())
            p_values = [str(v) if isinstance(v, UUID) else v for v in pago_data.values()]
            cur.execute(f"INSERT INTO sistema_facturacion.pagos_suscripciones ({', '.join(p_fields)}) VALUES ({', '.join(['%s']*len(p_fields))}) RETURNING id", tuple(p_values))
            pago_id = cur.fetchone()['id']

            # 2. Suscripcion (UPSERT)
            cur.execute("""
                INSERT INTO sistema_facturacion.suscripciones (empresa_id, plan_id, fecha_inicio, fecha_fin, estado, actualizado_por)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (empresa_id) DO UPDATE SET
                    plan_id = EXCLUDED.plan_id,
                    fecha_inicio = EXCLUDED.fecha_inicio,
                    fecha_fin = EXCLUDED.fecha_fin,
                    estado = EXCLUDED.estado,
                    actualizado_por = EXCLUDED.actualizado_por,
                    updated_at = NOW()
                RETURNING id
            """, (str(empresa_data['id']), str(pago_data['plan_id']), empresa_data['fecha_activacion'], empresa_data['fecha_vencimiento'], empresa_data['estado'], str(pago_data.get('registrado_por'))))
            suscripcion_id = cur.fetchone()['id']

            # 2.5 Registrar Log
            log_data = {
                "suscripcion_id": str(suscripcion_id),
                "estado_anterior": old_s['estado'] if old_s else None,
                "estado_nuevo": empresa_data['estado'],
                "plan_anterior": str(old_s['plan_id']) if old_s else None,
                "plan_nuevo": str(pago_data['plan_id']),
                "fecha_inicio_anterior": old_s['fecha_inicio'] if old_s else None,
                "fecha_fin_anterior": old_s['fecha_fin'] if old_s else None,
                "fecha_inicio_nuevo": empresa_data['fecha_activacion'],
                "fecha_fin_nuevo": empresa_data['fecha_vencimiento'],
                "cambiado_por": str(pago_data.get('registrado_por')),
                "origen": "ADMIN",
                "motivo": pago_data.get("observaciones", "Cambio de plan / Registro de pago")
            }
            l_fields = list(log_data.keys())
            cur.execute(f"INSERT INTO sistema_facturacion.suscripciones_log ({', '.join(l_fields)}) VALUES ({', '.join(['%s']*len(l_fields))})", tuple(log_data.values()))

            # 3. Comision
            if comision_data:
                comision_data['pago_suscripcion_id'] = str(pago_id)
                c_fields = list(comision_data.keys())
                placeholder_c = ["%s"] * len(c_fields)
                cur.execute(f"INSERT INTO sistema_facturacion.comisiones ({', '.join(c_fields)}) VALUES ({', '.join(placeholder_c)}) RETURNING id", tuple(comision_data.values()))
                comision_id = cur.fetchone()['id']

                # 3.5 Log de Comision
                # Fetch enriched data for snapshot (joins)
                cur.execute("""
                    SELECT c.*, v.nombres || ' ' || v.apellidos as vendedor_nombre,
                           v.nombres as vendedor_nombres, v.apellidos as vendedor_apellidos,
                           v.documento_identidad, uv.email as vendedor_email,
                           e.nombre_comercial as empresa_nombre, p.monto as monto_pago
                    FROM sistema_facturacion.comisiones c
                    LEFT JOIN sistema_facturacion.vendedores v ON c.vendedor_id = v.id
                    LEFT JOIN sistema_facturacion.users uv ON v.user_id = uv.id
                    LEFT JOIN sistema_facturacion.pagos_suscripciones p ON c.pago_suscripcion_id = p.id
                    LEFT JOIN sistema_facturacion.empresas e ON p.empresa_id = e.id
                    WHERE c.id = %s
                """, (str(comision_id),))
                c_full = dict(cur.fetchone())

                snapshot = {
                    "comision": {
                        "id": str(comision_id),
                        "estado": c_full['estado'],
                        "estado_nuevo": 'PENDIENTE'
                    },
                    "valores": {
                        "monto": float(c_full['monto']),
                        "porcentaje_aplicado": float(c_full['porcentaje_aplicado']),
                        "monto_pago": float(c_full['monto_pago'])
                    },
                    "fechas": {
                        "fecha_generacion": c_full['fecha_generacion'].isoformat() if isinstance(c_full['fecha_generacion'], (date, datetime)) else c_full['fecha_generacion']
                    },
                    "vendedor": {
                        "id": str(c_full['vendedor_id']),
                        "nombre": c_full['vendedor_nombre'],
                        "identificacion": c_full['documento_identidad'],
                        "email": c_full['vendedor_email']
                    },
                    "empresa": {
                        "razon_social": c_full['empresa_nombre']
                    },
                    "created_at": datetime.now().isoformat()
                }

                log_query = """
                    INSERT INTO sistema_facturacion.comisiones_logs (
                        comision_id, rol_responsable, estado_nuevo, datos_snapshot, observaciones
                    ) VALUES (%s, %s, %s, %s, %s)
                """
                cur.execute(log_query, (
                    str(comision_id),
                    'SISTEMA',
                    'PENDIENTE',
                    json.dumps(snapshot, default=str),
                    "Generación automática por suscripción"
                ))
            
            return pago_id

    def listar_pagos(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        query = "SELECT p.*, e.razon_social as razon_social, pl.nombre as plan_nombre FROM sistema_facturacion.pagos_suscripciones p " \
                "JOIN sistema_facturacion.empresas e ON p.empresa_id = e.id JOIN sistema_facturacion.planes pl ON p.plan_id = pl.id"
        params = []
        if empresa_id:
            query += " WHERE p.empresa_id = %s"
            params.append(str(empresa_id))
        query += " ORDER BY p.fecha_pago DESC"
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params) if params else None)
            return [dict(row) for row in cur.fetchall()]

    def obtener_suscripcion_por_empresa(self, empresa_id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM sistema_facturacion.suscripciones WHERE empresa_id = %s", (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_stats_dashboard(self) -> dict:
        with self.db.cursor() as cur:
            # 1. MRR (Total pagado en el último mes)
            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) as total_mrr 
                FROM sistema_facturacion.pagos_suscripciones 
                WHERE fecha_pago >= NOW() - INTERVAL '30 days'
            """)
            total_mrr = cur.fetchone()['total_mrr']

            # 2. Suscripciones Activas
            cur.execute("SELECT COUNT(*) as activas FROM sistema_facturacion.suscripciones WHERE estado = 'ACTIVA' AND fecha_fin >= CURRENT_DATE")
            activas = cur.fetchone()['activas']

            # 3. Plan más rentable
            cur.execute("""
                SELECT pl.nombre 
                FROM sistema_facturacion.planes pl
                JOIN sistema_facturacion.pagos_suscripciones p ON pl.id = p.plan_id
                GROUP BY pl.id, pl.nombre
                ORDER BY SUM(p.monto) DESC
                LIMIT 1
            """)
            row_plan = cur.fetchone()
            plan_rentable = row_plan['nombre'] if row_plan else "N/A"

            return {
                "total_mrr": total_mrr,
                "suscripciones_activas": activas,
                "plan_mas_rentable": plan_rentable,
                "crecimiento": 10.5 # Mocked growth for now
            }

    # --- Suscripciones Table CRUD ---
    def crear_suscripcion(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ['%s'] * len(fields)
        update_fields = [f'{k} = EXCLUDED.{k}' for k in fields if k not in ['empresa_id', 'created_at']]
        update_fields.append('updated_at = NOW()')
        query = f"""
            INSERT INTO sistema_facturacion.suscripciones ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            ON CONFLICT (empresa_id) DO UPDATE SET {', '.join(update_fields)}
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None


    # --- Audit Logging ---
    def registrar_log_suscripcion(self, log_data: dict):
        """Insert audit log entry"""
        fields = list(log_data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in log_data.values()]
        placeholders = ['%s'] * len(fields)
        query = f"""
            INSERT INTO sistema_facturacion.suscripciones_log ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_historial_suscripcion(self, suscripcion_id: UUID) -> List[dict]:
        """Get audit log history for a subscription"""
        query = """
            SELECT sl.*, 
                   pa.nombre as plan_anterior_nombre, 
                   pn.nombre as plan_nuevo_nombre, 
                   u.email as cambiado_por_email
            FROM sistema_facturacion.suscripciones_log sl
            LEFT JOIN sistema_facturacion.planes pa ON sl.plan_anterior = pa.id
            LEFT JOIN sistema_facturacion.planes pn ON sl.plan_nuevo = pn.id
            LEFT JOIN sistema_facturacion.users u ON sl.cambiado_por = u.id
            WHERE sl.suscripcion_id = %s
            ORDER BY sl.created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(suscripcion_id),))
            return [dict(row) for row in cur.fetchall()]

