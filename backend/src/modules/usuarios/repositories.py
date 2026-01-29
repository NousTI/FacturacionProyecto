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
                   COALESCE(u.telefono, v.telefono) as telefono,
                   er.nombre as rol_nombre,
                   er.codigo as rol_codigo
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
                   COALESCE(u.telefono, v.telefono) as telefono,
                   er.nombre as rol_nombre,
                   er.codigo as rol_codigo
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
                   er.codigo as rol_codigo
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
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
    
    def crear_usuario(self, user_data: dict, usuario_data: dict) -> Optional[dict]:
        """Create user in both users and usuarios tables atomically"""
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
            row = cur.fetchone()
            return dict(row) if row else None
    
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
