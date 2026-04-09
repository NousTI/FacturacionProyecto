from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioRenovaciones:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_solicitud(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"INSERT INTO sistema_facturacion.solicitudes_renovacion ({', '.join(fields)}) VALUES ({', '.join(placeholders)}) RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_solicitud_por_id(self, id: UUID) -> Optional[dict]:
        query = """
            SELECT sr.*, e.razon_social as empresa_nombre, p.nombre as plan_nombre,
            v.nombres || ' ' || v.apellidos as vendedor_nombre
            FROM sistema_facturacion.solicitudes_renovacion sr
            JOIN sistema_facturacion.empresas e ON sr.empresa_id = e.id
            JOIN sistema_facturacion.planes p ON sr.plan_id = p.id
            LEFT JOIN sistema_facturacion.vendedores v ON sr.vendedor_id = v.id
            WHERE sr.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_solicitudes(self, 
                          vendedor_id: Optional[UUID] = None, 
                          empresa_id: Optional[UUID] = None,
                          estado: Optional[str] = None) -> List[dict]:
        query = """
            SELECT sr.*, e.razon_social as empresa_nombre, p.nombre as plan_nombre,
            v.nombres || ' ' || v.apellidos as vendedor_nombre
            FROM sistema_facturacion.solicitudes_renovacion sr
            JOIN sistema_facturacion.empresas e ON sr.empresa_id = e.id
            JOIN sistema_facturacion.planes p ON sr.plan_id = p.id
            LEFT JOIN sistema_facturacion.vendedores v ON sr.vendedor_id = v.id
            WHERE 1=1
        """
        params = []
        if vendedor_id:
            query += " AND sr.vendedor_id = %s"
            params.append(str(vendedor_id))
        if empresa_id:
            query += " AND sr.empresa_id = %s"
            params.append(str(empresa_id))
        if estado:
            query += " AND sr.estado = %s"
            params.append(estado)

        query += " ORDER BY sr.fecha_solicitud DESC"

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def actualizar_estado(self, id: UUID, data: dict) -> Optional[dict]:
        fields = [f"{k} = %s" for k in data.keys()]
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        values.append(str(id))
        query = f"UPDATE sistema_facturacion.solicitudes_renovacion SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s RETURNING *"
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    # --- Métodos de Ayuda para Notificaciones ---
    def obtener_vendedor_por_empresa(self, empresa_id: UUID) -> Optional[dict]:
        query = """
            SELECT v.id as vendedor_id, v.user_id, v.nombres || ' ' || v.apellidos as nombre
            FROM sistema_facturacion.vendedores v
            JOIN sistema_facturacion.empresas e ON v.id = e.vendedor_id
            WHERE e.id = %s AND v.activo = TRUE
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_user_ids_superadmins(self) -> List[UUID]:
        query = "SELECT user_id FROM sistema_facturacion.superadmin WHERE activo = TRUE"
        with self.db.cursor() as cur:
            cur.execute(query)
            return [row['user_id'] for row in cur.fetchall()]

    def listar_user_ids_admins_empresa(self, empresa_id: UUID) -> List[UUID]:
        """Obtiene los IDs de usuario de quienes tienen rol administrativo en la empresa."""
        query = """
            SELECT u.user_id 
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            WHERE u.empresa_id = %s 
            AND (er.es_sistema = TRUE OR er.codigo LIKE 'ADMIN_%' OR er.nombre = 'Administrador de Empresa')
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [row['user_id'] for row in cur.fetchall()]
