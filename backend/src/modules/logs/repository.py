from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioLogs:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_log(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO log_emision ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_logs(self, limite: int = 100, desplazar: int = 0) -> List[dict]:
        query = "SELECT * FROM log_emision ORDER BY created_at DESC LIMIT %s OFFSET %s"
        with self.db.cursor() as cur:
            cur.execute(query, (limite, desplazar))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_factura(self, factura_id: UUID) -> List[dict]:
        query = "SELECT * FROM log_emision WHERE factura_id = %s ORDER BY created_at DESC"
        with self.db.cursor() as cur:
            cur.execute(query, (str(factura_id),))
            return [dict(row) for row in cur.fetchall()]

    # --- Auditoría General de Seguridad ---
    def _construir_query_auditoria(self, filters: dict = None):
        query_base = """
            WITH unified_logs AS (
                -- 1. Logs de Usuario/Seguridad
                SELECT 
                    l.id, l.created_at, l.user_id, l.evento, l.origen, l.motivo, 
                    l.ip_address, l.user_agent, 'SEGURIDAD' as modulo
                FROM sistema_facturacion.users_logs l
                
                UNION ALL
                
                -- 2. Logs de Comisiones
                SELECT 
                    cl.id, cl.created_at, cl.responsable_id as user_id, 
                    'COMISION_' || COALESCE(cl.estado_nuevo, 'ACCION') as evento, 
                    cl.rol_responsable as origen, 
                    cl.observaciones as motivo, 
                    NULL as ip_address, NULL as user_agent, 'COMISIONES' as modulo
                FROM sistema_facturacion.comisiones_logs cl
                
                UNION ALL
                
                -- 3. Logs de Suscripciones
                SELECT 
                    sl.id, sl.created_at, sl.cambiado_por as user_id, 
                    'PLAN_' || COALESCE(sl.estado_nuevo, 'CAMBIO') as evento, 
                    sl.origen, 
                    sl.motivo, 
                    NULL as ip_address, NULL as user_agent, 'SUSCRIPCIONES' as modulo
                FROM sistema_facturacion.suscripciones_log sl

                UNION ALL
                
                -- 4. Logs de Creación de Usuarios
                SELECT 
                    ucl.id, ucl.created_at, ucl.actor_user_id as user_id, 
                    'USUARIO_CREADO' as evento, 
                    ucl.origen, 
                    'Se creó el usuario ' || CAST(ucl.usuario_id AS TEXT) as motivo, 
                    NULL as ip_address, NULL as user_agent, 'USUARIOS' as modulo
                FROM sistema_facturacion.usuario_creacion_logs ucl
            )
            SELECT l.*, u.email as actor_email,
                   COALESCE(s.nombres || ' ' || s.apellidos, v.nombres || ' ' || v.apellidos, us.nombres || ' ' || us.apellidos, 'SISTEMA') as actor_nombre
            FROM unified_logs l
            LEFT JOIN sistema_facturacion.users u ON l.user_id = u.id
            LEFT JOIN sistema_facturacion.superadmin s ON u.id = s.user_id
            LEFT JOIN sistema_facturacion.vendedores v ON u.id = v.user_id
            LEFT JOIN sistema_facturacion.usuarios us ON u.id = us.user_id
        """
        
        conditions = []
        params = []

        if filters:
            if filters.get('usuario'):
                conditions.append("(u.email ILIKE %s OR s.nombres ILIKE %s OR s.apellidos ILIKE %s)")
                val = f"%{filters['usuario']}%"
                params.extend([val, val, val])
            
            if filters.get('fecha_inicio'):
                conditions.append("l.created_at >= %s")
                params.append(filters['fecha_inicio'])
            
            if filters.get('fecha_fin'):
                conditions.append("l.created_at <= %s")
                params.append(filters['fecha_fin'])
            
            if filters.get('evento'):
                conditions.append("l.evento = %s")
                params.append(filters['evento'])

        if conditions:
            query_base += " WHERE " + " AND ".join(conditions)

        return query_base, params

    def listar_auditoria(self, filters: dict = None, limit: int = 100, offset: int = 0) -> List[dict]:
        query, params = self._construir_query_auditoria(filters)
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_auditoria_exportar(self, filters: dict = None) -> List[dict]:
        query, params = self._construir_query_auditoria(filters)
        query += " ORDER BY created_at DESC LIMIT 5000"

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def registrar_evento(self, user_id: UUID, evento: str, detail: str = None, ip: str = None, ua: str = None, origen: str = 'SISTEMA'):
        query = """
            INSERT INTO sistema_facturacion.users_logs (user_id, evento, origen, motivo, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(user_id) if user_id else None, evento, origen, detail, ip, ua))
