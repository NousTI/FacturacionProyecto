from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioRoles:
    def __init__(self, db=Depends(get_db)):
        self.db = db
    
    # --- Permisos (System-wide catalog) ---
    def listar_permisos(self) -> List[dict]:
        """List all system permissions"""
        query = """
            SELECT * FROM sistema_facturacion.empresa_permisos
            ORDER BY modulo, tipo, nombre
        """
        with self.db.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]
    
    def obtener_permiso(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.empresa_permisos WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None
    
    def crear_permiso(self, data: dict) -> Optional[dict]:
        """Create system permission (superadmin only)"""
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        query = f"""
            INSERT INTO sistema_facturacion.empresa_permisos ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None
    
    # --- Roles (Empresa-specific) ---
    def listar_roles(self, empresa_id: UUID) -> List[dict]:
        """List roles for an empresa with their permissions"""
        query = """
            SELECT r.*, 
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', p.id,
                               'codigo', p.codigo,
                               'nombre', p.nombre,
                               'modulo', p.modulo,
                               'tipo', p.tipo,
                               'descripcion', p.descripcion,
                               'created_at', p.created_at,
                               'updated_at', p.updated_at
                           )
                       ) FILTER (WHERE p.id IS NOT NULL),
                       '[]'
                   ) as permisos
            FROM sistema_facturacion.empresa_roles r
            LEFT JOIN sistema_facturacion.empresa_roles_permisos rp ON r.id = rp.rol_id
            LEFT JOIN sistema_facturacion.empresa_permisos p ON rp.permiso_id = p.id
            WHERE r.empresa_id = %s
            GROUP BY r.id
            ORDER BY r.es_sistema DESC, r.nombre
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]
    
    def obtener_rol(self, id: UUID) -> Optional[dict]:
        query = """
            SELECT r.*,
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', p.id,
                               'codigo', p.codigo,
                               'nombre', p.nombre,
                               'modulo', p.modulo,
                               'tipo', p.tipo,
                               'descripcion', p.descripcion,
                               'created_at', p.created_at,
                               'updated_at', p.updated_at
                           )
                       ) FILTER (WHERE p.id IS NOT NULL),
                       '[]'
                   ) as permisos
            FROM sistema_facturacion.empresa_roles r
            LEFT JOIN sistema_facturacion.empresa_roles_permisos rp ON r.id = rp.rol_id
            LEFT JOIN sistema_facturacion.empresa_permisos p ON rp.permiso_id = p.id
            WHERE r.id = %s
            GROUP BY r.id
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None
    
    def obtener_rol_admin_por_empresa(self, empresa_id: UUID) -> Optional[dict]:
        """Find the default admin role for a company"""
        query = """
            SELECT * FROM sistema_facturacion.empresa_roles 
            WHERE empresa_id = %s AND es_sistema = TRUE 
            AND (nombre = 'Administrador de Empresa' OR codigo LIKE 'ADMIN_%%')
            LIMIT 1
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None
    
    def crear_rol(self, empresa_id: UUID, data: dict, permiso_ids: List[UUID]) -> Optional[dict]:
        """Create role and assign permissions atomically"""
        with db_transaction(self.db) as cur:
            # Create role
            rol_data = {**data, 'empresa_id': empresa_id}
            fields = list(rol_data.keys())
            values = [str(v) if isinstance(v, UUID) else v for v in rol_data.values()]
            placeholders = ["%s"] * len(fields)
            query = f"""
                INSERT INTO sistema_facturacion.empresa_roles ({', '.join(fields)})
                VALUES ({', '.join(placeholders)})
                RETURNING *
            """
            cur.execute(query, tuple(values))
            rol = dict(cur.fetchone())
            
            # Assign permissions
            if permiso_ids:
                for permiso_id in permiso_ids:
                    cur.execute("""
                        INSERT INTO sistema_facturacion.empresa_roles_permisos (rol_id, permiso_id)
                        VALUES (%s, %s)
                    """, (str(rol['id']), str(permiso_id)))
            
            return rol
    
    def actualizar_rol(self, id: UUID, data: dict, permiso_ids: Optional[List[UUID]] = None) -> Optional[dict]:
        """Update role and optionally reassign permissions"""
        with db_transaction(self.db) as cur:
            # Update role
            if data:
                set_clauses = [f"{k} = %s" for k in data.keys()]
                values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
                values.append(str(id))
                query = f"""
                    UPDATE sistema_facturacion.empresa_roles
                    SET {', '.join(set_clauses)}, updated_at = NOW()
                    WHERE id = %s
                    RETURNING *
                """
                cur.execute(query, tuple(values))
                rol = cur.fetchone()
            else:
                cur.execute("SELECT * FROM sistema_facturacion.empresa_roles WHERE id = %s", (str(id),))
                rol = cur.fetchone()
            
            # Update permissions if provided
            if permiso_ids is not None:
                # Delete existing
                cur.execute("DELETE FROM sistema_facturacion.empresa_roles_permisos WHERE rol_id = %s", (str(id),))
                # Insert new
                for permiso_id in permiso_ids:
                    cur.execute("""
                        INSERT INTO sistema_facturacion.empresa_roles_permisos (rol_id, permiso_id)
                        VALUES (%s, %s)
                    """, (str(id), str(permiso_id)))
            
            return dict(rol) if rol else None
    
    def eliminar_rol(self, id: UUID) -> bool:
        """Delete role (only if not es_sistema)"""
        query = """
            DELETE FROM sistema_facturacion.empresa_roles
            WHERE id = %s AND es_sistema = FALSE
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
    
    # --- Individual Permission Management ---
    def asignar_permiso(self, rol_id: UUID, permiso_id: UUID) -> bool:
        """Assign a single permission to a role"""
        query = """
            INSERT INTO sistema_facturacion.empresa_roles_permisos (rol_id, permiso_id)
            VALUES (%s, %s)
            ON CONFLICT (rol_id, permiso_id) DO NOTHING
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(rol_id), str(permiso_id)))
            return True
    
    def remover_permiso(self, rol_id: UUID, permiso_id: UUID) -> bool:
        """Remove a single permission from a role"""
        query = """
            DELETE FROM sistema_facturacion.empresa_roles_permisos
            WHERE rol_id = %s AND permiso_id = %s
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(rol_id), str(permiso_id)))
            return cur.rowcount > 0

