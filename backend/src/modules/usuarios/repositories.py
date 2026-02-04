from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioUsuarios:
    def __init__(self, db=Depends(get_db)):
        self.db = db
    
    def listar_usuarios(self, empresa_id: UUID) -> List[dict]:
        """List users for an empresa with their role and email"""
        query = """
            SELECT u.*, 
                   us.email,
                   er.nombre as rol_nombre,
                   er.codigo as rol_codigo
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            WHERE u.empresa_id = %s
            ORDER BY u.apellidos, u.nombres
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]
    
    def obtener_por_correo(self, email: str) -> Optional[dict]:
        """Get user from auth table (sistema_facturacion.users)"""
        query = """
            SELECT us.*, 
                   u.id as usuario_id,
                   u.empresa_id,
                   COALESCE(u.nombres, s.nombres, v.nombres) as nombres,
                   COALESCE(u.apellidos, s.apellidos, v.apellidos) as apellidos,
                   u.avatar_url,
                   COALESCE(u.telefono, v.telefono) as telefono,
                   er.nombre as rol_nombre,
                   er.codigo as rol_codigo,
                   v.id as internal_vendedor_id
            FROM sistema_facturacion.users us
            LEFT JOIN sistema_facturacion.usuarios u ON us.id = u.user_id
            LEFT JOIN sistema_facturacion.superadmin s ON us.id = s.user_id
            LEFT JOIN sistema_facturacion.vendedores v ON us.id = v.user_id
            LEFT JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            WHERE us.email = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (email,))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, user_id: UUID) -> Optional[dict]:
        """Get user by auth ID (sistema_facturacion.users)"""
        query = """
            SELECT us.*, 
                   u.id as usuario_id,
                   u.empresa_id,
                   COALESCE(u.nombres, s.nombres, v.nombres) as nombres,
                   COALESCE(u.apellidos, s.apellidos, v.apellidos) as apellidos,
                   u.avatar_url,
                   COALESCE(u.telefono, v.telefono) as telefono,
                   er.nombre as rol_nombre,
                   er.codigo as rol_codigo,
                   v.id as internal_vendedor_id
            FROM sistema_facturacion.users us
            LEFT JOIN sistema_facturacion.usuarios u ON us.id = u.user_id
            LEFT JOIN sistema_facturacion.superadmin s ON us.id = s.user_id
            LEFT JOIN sistema_facturacion.vendedores v ON us.id = v.user_id
            LEFT JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            WHERE us.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(user_id),))
            row = cur.fetchone()
            return dict(row) if row else None
    
    def obtener_usuario(self, id: UUID) -> Optional[dict]:
        """Get user with role and email info"""
        query = """
            SELECT u.*, 
                   us.email,
                   er.nombre as rol_nombre,
                   er.codigo as rol_codigo,
                   e.razon_social as empresa_nombre
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
            WHERE u.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None
    
    def obtener_por_user_id(self, user_id: UUID) -> Optional[dict]:
        """Get usuario by authentication user_id"""
        query = """
            SELECT u.*, 
                   us.email,
                   er.nombre as rol_nombre
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            WHERE u.user_id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(user_id),))
            row = cur.fetchone()
            return dict(row) if row else None
    
    def crear_auth_user(self, user_data: dict) -> Optional[dict]:
        """Create only the authentication record in users table"""
        user_fields = list(user_data.keys())
        user_values = [str(v) if isinstance(v, UUID) else v for v in user_data.values()]
        user_placeholders = ["%s"] * len(user_fields)
        
        user_query = f"""
            INSERT INTO sistema_facturacion.users ({', '.join(user_fields)})
            VALUES ({', '.join(user_placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(user_query, tuple(user_values))
            row = cur.fetchone()
            return dict(row) if row else None
    
    def crear_usuario(self, user_data: dict, usuario_data: dict, log_data: Optional[dict] = None) -> Optional[dict]:
        """Create user in both users and usuarios tables atomically, with optional creation log"""
        with db_transaction(self.db) as cur:
            # 1. Create in users table
            user_fields = list(user_data.keys())
            user_values = [str(v) if isinstance(v, UUID) else v for v in user_data.values()]
            user_placeholders = ["%s"] * len(user_fields)
            
            user_query = f"""
                INSERT INTO sistema_facturacion.users ({', '.join(user_fields)})
                VALUES ({', '.join(user_placeholders)})
                RETURNING id
            """
            cur.execute(user_query, tuple(user_values))
            user_id = cur.fetchone()['id']
            
            # 2. Create in usuarios table
            usuario_data['user_id'] = user_id
            usuario_fields = list(usuario_data.keys())
            usuario_values = [str(v) if isinstance(v, UUID) else v for v in usuario_data.values()]
            usuario_placeholders = ["%s"] * len(usuario_fields)
            
            usuario_query = f"""
                INSERT INTO sistema_facturacion.usuarios ({', '.join(usuario_fields)})
                VALUES ({', '.join(usuario_placeholders)})
                RETURNING *
            """
            cur.execute(usuario_query, tuple(usuario_values))
            usuario = dict(cur.fetchone())

            # 3. Create log if data provided
            if log_data:
                import json
                log_data['usuario_id'] = usuario['id']
                log_fields = list(log_data.keys())
                # Convert dict to JSON string for JSONB columns
                log_values = [
                    str(v) if isinstance(v, UUID) 
                    else json.dumps(v) if isinstance(v, dict) 
                    else v 
                    for v in log_data.values()
                ]
                log_placeholders = ["%s"] * len(log_fields)
                
                log_query = f"""
                    INSERT INTO sistema_facturacion.usuario_creacion_logs ({', '.join(log_fields)})
                    VALUES ({', '.join(log_placeholders)})
                """
                cur.execute(log_query, tuple(log_values))
            
            return usuario
    
    def actualizar_usuario(self, id: UUID, data: dict) -> Optional[dict]:
        """Update usuario"""
        if not data:
            return self.obtener_usuario(id)
        
        set_clauses = [f"{k} = %s" for k in data.keys()]
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        values.append(str(id))
        
        query = f"""
            UPDATE sistema_facturacion.usuarios
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None
    
    def eliminar_usuario(self, id: UUID) -> bool:
        """Delete usuario (CASCADE will delete from users table)"""
        query = "DELETE FROM sistema_facturacion.usuarios WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def obtener_perfil_completo(self, user_id: UUID) -> Optional[dict]:
        """Fetch full profile: user (profile + auth), company, role and permissions"""
        # 1. Get User and Company Info
        query_user = """
            SELECT 
                u.id, u.user_id, u.nombres, u.apellidos, u.telefono, u.avatar_url, u.activo,
                us.email, us.role as system_role, us.estado as system_estado, 
                us.ultimo_acceso, us.created_at, us.updated_at,
                er.nombre as rol_nombre, er.codigo as rol_codigo, er.id as rol_id,
                e.id as empresa_id, e.ruc as empresa_ruc, e.razon_social as empresa_razon_social,
                e.nombre_comercial as empresa_nombre_comercial, e.email as empresa_email,
                e.direccion as empresa_direccion, e.logo_url as empresa_logo_url
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            WHERE u.user_id = %s
        """
        
        with self.db.cursor() as cur:
            cur.execute(query_user, (str(user_id),))
            user_row = cur.fetchone()
            if not user_row:
                return None
            
            user_data = dict(user_row)
            rol_id = user_data['rol_id']
            
            # 2. Get Permissions for the role
            query_perms = """
                SELECT p.id, p.codigo, p.nombre, p.modulo, p.tipo, p.descripcion
                FROM sistema_facturacion.empresa_permisos p
                JOIN sistema_facturacion.empresa_roles_permisos erp ON p.id = erp.permiso_id
                WHERE erp.rol_id = %s AND erp.activo = TRUE
            """
            cur.execute(query_perms, (str(rol_id),))
            permisos = [dict(row) for row in cur.fetchall()]
            
            # 3. Format result
            result = {
                "id": user_data["id"],
                "user_id": user_data["user_id"],
                "nombres": user_data["nombres"],
                "apellidos": user_data["apellidos"],
                "email": user_data["email"],
                "telefono": user_data["telefono"],
                "avatar_url": user_data["avatar_url"],
                "activo": user_data["activo"],
                "system_role": user_data["system_role"],
                "system_estado": user_data["system_estado"],
                "ultimo_acceso": user_data["ultimo_acceso"],
                "created_at": user_data["created_at"],
                "updated_at": user_data["updated_at"],
                "empresa": {
                    "id": user_data["empresa_id"],
                    "ruc": user_data["empresa_ruc"],
                    "razon_social": user_data["empresa_razon_social"],
                    "nombre_comercial": user_data["empresa_nombre_comercial"],
                    "email": user_data["empresa_email"],
                    "direccion": user_data["empresa_direccion"],
                    "logo_url": user_data["empresa_logo_url"]
                },
                "rol_nombre": user_data["rol_nombre"],
                "rol_codigo": user_data["rol_codigo"],
                "permisos": permisos
            }
            return result

    def listar_todos_usuarios_admin(self, vendedor_id: Optional[UUID] = None, actor_user_id: Optional[UUID] = None) -> List[dict]:
        """List all users with their company and role info for Superadmin/Vendedor context."""
        query = """
            SELECT 
                u.id, u.user_id, u.nombres, u.apellidos, u.telefono, u.avatar_url, u.activo,
                us.email, us.ultimo_acceso, us.created_at, u.updated_at,
                er.nombre as rol_nombre, er.id as empresa_rol_id,
                e.id as empresa_id, e.razon_social as empresa_nombre, e.vendedor_id,
                l.origen as origen_creacion
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            LEFT JOIN sistema_facturacion.usuario_creacion_logs l ON u.id = l.usuario_id
        """
        params = []
        where_clauses = []
        
        if vendedor_id:
            if actor_user_id:
                where_clauses.append("(e.vendedor_id = %s OR l.actor_user_id = %s)")
                params.extend([str(vendedor_id), str(actor_user_id)])
            else:
                where_clauses.append("e.vendedor_id = %s")
                params.append(str(vendedor_id))
        elif actor_user_id:
            where_clauses.append("l.actor_user_id = %s")
            params.append(str(actor_user_id))
            
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        query += " ORDER BY us.created_at DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_stats_admin(self, vendedor_id: Optional[UUID] = None, actor_user_id: Optional[UUID] = None) -> dict:
        """Get user stats for Superadmin/Vendedor context."""
        query = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN u.activo = TRUE THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN u.activo = FALSE THEN 1 ELSE 0 END) as inactivos
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
            LEFT JOIN sistema_facturacion.usuario_creacion_logs l ON u.id = l.usuario_id
        """
        params = []
        where_clauses = []
        
        if vendedor_id:
            if actor_user_id:
                where_clauses.append("(e.vendedor_id = %s OR l.actor_user_id = %s)")
                params.extend([str(vendedor_id), str(actor_user_id)])
            else:
                where_clauses.append("e.vendedor_id = %s")
                params.append(str(vendedor_id))
        elif actor_user_id:
            where_clauses.append("l.actor_user_id = %s")
            params.append(str(actor_user_id))
            
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            return dict(row) if row else {"total": 0, "activos": 0, "inactivos": 0}
