from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from typing import List, Optional

class RolRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def list_roles(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        """List roles. If empresa_id is provided, filter by it. Otherwise return all (for superadmin)."""
        if not self.db: return []
        
        query = "SELECT * FROM rol WHERE activo = TRUE"
        params = []
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
            
        query += " ORDER BY created_at DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return cur.fetchall()

    def get_rol(self, rol_id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM rol WHERE id = %s", (str(rol_id),))
            return cur.fetchone()

    def create_rol(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        with db_transaction(self.db) as cur:
            fields = ["empresa_id", "codigo", "nombre", "descripcion", "es_sistema", "activo"]
            values = [
                str(data.get("empresa_id")),
                data.get("codigo"),
                data.get("nombre"),
                data.get("descripcion"),
                data.get("es_sistema", False),
                data.get("activo", True)
            ]
            
            query = f"""
                INSERT INTO rol ({', '.join(fields)})
                VALUES ({', '.join(['%s'] * len(fields))})
                RETURNING *
            """
            cur.execute(query, tuple(values))
            return cur.fetchone()

    def update_rol(self, rol_id: UUID, data: dict) -> Optional[dict]:
        if not self.db: return None
        with db_transaction(self.db) as cur:
            fields = []
            params = []
            for k, v in data.items():
                if v is not None:
                    fields.append(f"{k} = %s")
                    params.append(v)
            
            if not fields: return None
            
            query = f"UPDATE rol SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s RETURNING *"
            params.append(str(rol_id))
            
            cur.execute(query, tuple(params))
            return cur.fetchone()

    def delete_rol(self, rol_id: UUID) -> Optional[dict]:
        if not self.db: return None
        with db_transaction(self.db) as cur:
                # Soft delete
            cur.execute("UPDATE rol SET activo = FALSE WHERE id = %s RETURNING *", (str(rol_id),))
            return cur.fetchone()

    def assign_permissions(self, rol_id: UUID, permission_ids: List[UUID]) -> bool:
        if not self.db: return False
        
        with db_transaction(self.db) as cur:
            # 1. Clear existing permissions for this role
            cur.execute("DELETE FROM rol_permiso WHERE rol_id = %s", (str(rol_id),))
            
            # 2. Insert new ones
            if permission_ids:
                values = []
                for pid in permission_ids:
                    values.append((str(rol_id), str(pid)))
                
                args_str = ','.join(cur.mogrify("(%s,%s)", x).decode('utf-8') for x in values)
                cur.execute("INSERT INTO rol_permiso (rol_id, permiso_id) VALUES " + args_str)
            return True

    def add_permission(self, rol_id: UUID, permission_id: UUID) -> bool:
        if not self.db: return False
        with db_transaction(self.db) as cur:
            # Use ON CONFLICT DO NOTHING to avoid duplicate errors if unique constraint exists,
            # but explicit check is also fine or just INSERT IGNORE logic.
            # Since rol_permiso PK is (rol_id, permiso_id), we can try simple insert and catch error or check first.
            cur.execute(
                "INSERT INTO rol_permiso (rol_id, permiso_id) VALUES (%s, %s) ON CONFLICT (rol_id, permiso_id) DO NOTHING", 
                (str(rol_id), str(permission_id))
            )
            return True

    def remove_permission(self, rol_id: UUID, permission_id: UUID) -> bool:
        if not self.db: return False
        with db_transaction(self.db) as cur:
            cur.execute(
                "DELETE FROM rol_permiso WHERE rol_id = %s AND permiso_id = %s", 
                (str(rol_id), str(permission_id))
            )
            return True

    def get_role_permissions(self, rol_id: UUID) -> List[dict]:
        if not self.db: return []
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT p.*, rp.created_at as assigned_at, rp.updated_at as assigned_updated_at, rp.activo
                FROM permiso p
                JOIN rol_permiso rp ON p.id = rp.permiso_id
                WHERE rp.rol_id = %s
            """, (str(rol_id),))
            return cur.fetchall()

    def get_role_permission(self, rol_id: UUID, permission_id: UUID) -> Optional[dict]:
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT p.*, rp.created_at as assigned_at, rp.updated_at as assigned_updated_at, rp.activo
                FROM permiso p
                JOIN rol_permiso rp ON p.id = rp.permiso_id
                WHERE rp.rol_id = %s AND rp.permiso_id = %s
            """, (str(rol_id), str(permission_id)))
            return cur.fetchone()

    def update_permission(self, rol_id: UUID, permission_id: UUID, data: dict) -> Optional[dict]:
        if not self.db: return None
        with db_transaction(self.db) as cur:
            fields = []
            params = []
            for k, v in data.items():
                if v is not None:
                    fields.append(f"{k} = %s")
                    params.append(v)
            
            if not fields: return None
            
            query = f"UPDATE rol_permiso SET {', '.join(fields)}, updated_at = NOW() WHERE rol_id = %s AND permiso_id = %s RETURNING *"
            params.append(str(rol_id))
            params.append(str(permission_id))
            
            cur.execute(query, tuple(params))
            return cur.fetchone()
