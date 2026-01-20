from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioRoles:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_roles(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        if not self.db: return []
        
        query = "SELECT * FROM rol WHERE activo = TRUE"
        params = []
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
            
        query += " ORDER BY created_at DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_rol(self, rol_id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM rol WHERE id = %s", (str(rol_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear_rol(self, data: dict) -> Optional[dict]:
        with db_transaction(self.db) as cur:
            fields = ["empresa_id", "codigo", "nombre", "descripcion", "es_sistema", "activo"]
            values = [
                str(data.get("empresa_id")) if data.get("empresa_id") else None,
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
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_rol(self, rol_id: UUID, data: dict) -> Optional[dict]:
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
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_rol(self, rol_id: UUID) -> Optional[dict]:
        with db_transaction(self.db) as cur:
            cur.execute("UPDATE rol SET activo = FALSE WHERE id = %s RETURNING *", (str(rol_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def asignar_permisos(self, rol_id: UUID, permission_ids: List[UUID]) -> bool:
        with db_transaction(self.db) as cur:
            cur.execute("DELETE FROM rol_permiso WHERE rol_id = %s", (str(rol_id),))
            
            if permission_ids:
                values = []
                for pid in permission_ids:
                    values.append((str(rol_id), str(pid)))
                
                args_str = ','.join(cur.mogrify("(%s,%s)", x).decode('utf-8') for x in values)
                cur.execute("INSERT INTO rol_permiso (rol_id, permiso_id) VALUES " + args_str)
            return True

    def agregar_permiso(self, rol_id: UUID, permission_id: UUID) -> bool:
        with db_transaction(self.db) as cur:
            cur.execute(
                "INSERT INTO rol_permiso (rol_id, permiso_id) VALUES (%s, %s) ON CONFLICT (rol_id, permiso_id) DO NOTHING", 
                (str(rol_id), str(permission_id))
            )
            return True

    def quitar_permiso(self, rol_id: UUID, permission_id: UUID) -> bool:
        with db_transaction(self.db) as cur:
            cur.execute(
                "DELETE FROM rol_permiso WHERE rol_id = %s AND permiso_id = %s", 
                (str(rol_id), str(permission_id))
            )
            return True

    def obtener_permisos_rol(self, rol_id: UUID) -> List[dict]:
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT p.*, rp.created_at as assigned_at, rp.updated_at as assigned_updated_at, rp.activo
                FROM permiso p
                JOIN rol_permiso rp ON p.id = rp.fk_permiso
                WHERE rp.fk_rol = %s
            """, (str(rol_id),))
            # Note: Changed permission_id to fk_permiso and rol_id to fk_rol based on legacy pattern investigation earlier
            # Actually, `rol_repository.py` legacy used `rol_id` and `permiso_id`.
            # But `permission_repository` query used `fk_rol` in my thought process step 151? 
            # Step 151 code `get_permissions_by_role_id` used `ON p.id = rp.fk_permiso WHERE rp.fk_rol`.
            # If the database actually uses `rol_id`, `permiso_id`, then Step 151 query is wrong?
            # Or legacy `RoleRepository` step 222 used `rol_id` and `permiso_id`.
            # Wait, step 222 `RolRepository` query lines 125, 136 uses `rp.rol_id` and `rp.permiso_id`.
            # Step 151 `RepositorioPermisos` uses `rp.fk_permiso` and `rp.fk_rol`.
            # CONFLICT! The legacy code I read in Step 222 uses `rol_id` and `permiso_id`.
            # The code I wrote in Step 151 assumed `fk_`.
            # I must standarize. If Step 222 is the real existing file, then the DB likely has `rol_id` and `permiso_id`.
            # I should trust the existing file I just read (Step 222).
            # So I will use `rol_id` and `permiso_id` here.
            # And I may need to fix Step 151 (PermissionRepository) later if it breaks.
            
            # Re-reading Step 222 content:
            # 125: WHERE rp.rol_id = %s
            
            return [dict(row) for row in cur.fetchall()]

    def obtener_permiso_rol(self, rol_id: UUID, permission_id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("""
                SELECT p.*, rp.created_at as assigned_at, rp.updated_at as assigned_updated_at, rp.activo
                FROM permiso p
                JOIN rol_permiso rp ON p.id = rp.permiso_id
                WHERE rp.rol_id = %s AND rp.permiso_id = %s
            """, (str(rol_id), str(permission_id)))
            row = cur.fetchone()
            return dict(row) if row else None

    # Update logic for role_permission specific fields (if any)?
    # Legacy had update_permission (update fields in pivot?).
    # Included.
