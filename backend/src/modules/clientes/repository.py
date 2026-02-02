from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioClientes:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_clientes(self, vendedor_id: Optional[UUID] = None, empresa_id: Optional[UUID] = None) -> List[dict]:
        query = """
            SELECT u.*, us.email, us.ultimo_acceso, e.nombre_comercial as empresa_nombre, er.nombre as rol_nombre
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
        """
        params = []
        conditions = []
        
        if vendedor_id:
            conditions.append("e.vendedor_id = %s")
            params.append(str(vendedor_id))
        
        if empresa_id:
            conditions.append("u.empresa_id = %s")
            params.append(str(empresa_id))
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY u.created_at DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_stats(self, vendedor_id: Optional[UUID] = None) -> dict:
        query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE u.activo = true) as activos,
                COUNT(*) FILTER (WHERE u.activo = false) as inactivos
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
        """
        params = []
        if vendedor_id:
            query += " WHERE e.vendedor_id = %s"
            params.append(str(vendedor_id))
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            return dict(row) if row else {"total": 0, "activos": 0, "inactivos": 0}

    def crear_cliente_atomico(self, user_data: dict, usuario_data: dict, log_data: Optional[dict] = None) -> Optional[dict]:
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
                RETURNING id
            """
            cur.execute(usuario_query, tuple(usuario_values))
            cliente_id = cur.fetchone()['id']
            
            # 3. Create audit log if data provided
            if log_data:
                import json
                log_data['usuario_id'] = cliente_id
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
            
            # Re-fetch with joins for return
            cur.execute("""
                SELECT u.*, us.email, us.ultimo_acceso, e.nombre_comercial as empresa_nombre, er.nombre as rol_nombre
                FROM sistema_facturacion.usuarios u
                JOIN sistema_facturacion.users us ON u.user_id = us.id
                JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
                JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
                WHERE u.id = %s
            """, (str(cliente_id),))
            return dict(cur.fetchone())

    def eliminar_cliente(self, id: UUID) -> bool:
        # Success when deleting from usuarios (CASCADE handles users table)
        query = "DELETE FROM sistema_facturacion.usuarios WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = """
            SELECT u.*, us.email, us.ultimo_acceso, e.nombre_comercial as empresa_nombre, er.nombre as rol_nombre
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            WHERE u.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_cliente_con_trazabilidad(self, id: UUID) -> Optional[dict]:
        """Obtiene cliente con información de quién lo creó desde usuario_creacion_logs"""
        query = """
            SELECT 
                u.*, 
                us.email, 
                us.ultimo_acceso, 
                e.nombre_comercial as empresa_nombre, 
                er.nombre as rol_nombre,
                
                -- Trazabilidad desde logs
                ucl.origen as origen_creacion,
                ucl.created_at as fecha_creacion_log,
                ucl.actor_rol_sistema as creado_por_rol,
                
                -- Info del creador
                creador_us.email as creado_por_email,
                COALESCE(
                    creador_u.nombres || ' ' || creador_u.apellidos,
                    'Sistema'
                ) as creado_por_nombre
                
            FROM sistema_facturacion.usuarios u
            JOIN sistema_facturacion.users us ON u.user_id = us.id
            JOIN sistema_facturacion.empresas e ON u.empresa_id = e.id
            JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            
            -- Join con logs de creación
            LEFT JOIN sistema_facturacion.usuario_creacion_logs ucl ON u.id = ucl.usuario_id
            LEFT JOIN sistema_facturacion.users creador_us ON ucl.actor_user_id = creador_us.id
            LEFT JOIN sistema_facturacion.usuarios creador_u ON creador_us.id = creador_u.user_id
            
            WHERE u.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_cliente(self, id: UUID, datos: dict) -> Optional[dict]:
        """Actualiza datos del cliente"""
        with db_transaction(self.db) as cur:
            # Separate email from other fields
            email = datos.pop('email', None)
            
            # Update usuarios table
            if datos:
                set_clauses = []
                values = []
                for key, value in datos.items():
                    if value is not None:
                        set_clauses.append(f"{key} = %s")
                        values.append(str(value) if isinstance(value, UUID) else value)
                
                if set_clauses:
                    values.append(str(id))
                    query = f"""
                        UPDATE sistema_facturacion.usuarios
                        SET {', '.join(set_clauses)}, updated_at = NOW()
                        WHERE id = %s
                    """
                    cur.execute(query, tuple(values))
            
            # Update email in users table if provided
            if email:
                cur.execute("""
                    UPDATE sistema_facturacion.users
                    SET email = %s
                    WHERE id = (SELECT user_id FROM sistema_facturacion.usuarios WHERE id = %s)
                """, (email, str(id)))
            
            return self.obtener_por_id(id)

    def toggle_status(self, id: UUID) -> Optional[dict]:
        """Activa/desactiva un cliente"""
        query = """
            UPDATE sistema_facturacion.usuarios
            SET activo = NOT activo, updated_at = NOW()
            WHERE id = %s
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return self.obtener_por_id(id)

    def reasignar_empresa(self, id: UUID, nueva_empresa_id: UUID) -> Optional[dict]:
        """Reasigna un cliente a una nueva empresa"""
        with db_transaction(self.db) as cur:
            # Verificar que el cliente existe
            cur.execute("SELECT * FROM sistema_facturacion.usuarios WHERE id = %s", (str(id),))
            cliente = cur.fetchone()
            if not cliente:
                return None
            
            # Obtener el rol de administrador de la nueva empresa
            cur.execute("""
                SELECT id FROM sistema_facturacion.empresa_roles 
                WHERE empresa_id = %s AND nombre = 'Administrador de Empresa'
                LIMIT 1
            """, (str(nueva_empresa_id),))
            rol = cur.fetchone()
            
            if not rol:
                raise ValueError("No se encontró rol de administrador para la nueva empresa")
            
            # Actualizar empresa y rol
            cur.execute("""
                UPDATE sistema_facturacion.usuarios 
                SET empresa_id = %s, empresa_rol_id = %s, updated_at = NOW()
                WHERE id = %s
            """, (str(nueva_empresa_id), str(rol['id']), str(id)))
            
            # Retornar cliente actualizado
            return self.obtener_por_id(id)

