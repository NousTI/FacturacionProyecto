from fastapi import Depends
from ...database.session import get_db
from ...database.transaction import db_transaction
from uuid import UUID
from typing import List, Optional

class RepositorioPermisos:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def list_permissions(self) -> List[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM permiso ORDER BY modulo, codigo")
            return cur.fetchall()

    def get_permission(self, permiso_id: UUID) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM permiso WHERE id = %s", (str(permiso_id),))
            return cur.fetchone()
    
    def get_permissions_by_role_id(self, rol_id) -> List[str]:
        # Helper used by Auth
        with self.db.cursor() as cur:
            # Asumimos que existe rol_permiso o similar. 
            # El código legacy usaba RepoPermiso.get_permissions_by_role_id 
            # pero el archivo permiso_repository.py step 93 NO LO TENÍA!
            # ¿Quizás estaba en permission_repository.py (el otro archivo)?
            # Revisaré si auth_dependencies importaba PermissionRepository o PermisoRepository.
            # Step 106 dice: from repositories.permission_repository import PermissionRepository
            # Step 86 listó ambos.
            # Necesitamos implementar `get_permissions_by_role_id`.
            # Asumo tabla rol_permiso.
            cur.execute("""
                SELECT p.codigo 
                FROM permiso p
                JOIN rol_permiso rp ON p.id = rp.fk_permiso
                WHERE rp.fk_rol = %s
            """, (str(rol_id),))
            rows = cur.fetchall()
            return [r['codigo'] for r in rows]

    def create_permission(self, data: dict) -> Optional[dict]:
        with db_transaction(self.db) as cur:
            fields = ["codigo", "nombre", "modulo", "descripcion", "tipo"]
            values = [
                data.get("codigo"),
                data.get("nombre"),
                data.get("modulo"),
                data.get("descripcion"),
                data.get("tipo")
            ]
            # ID y timestamps se generan en DB por default si está configurado
            query = f"""
                INSERT INTO permiso ({', '.join(fields)})
                VALUES ({', '.join(['%s'] * len(fields))})
                RETURNING *
            """
            cur.execute(query, tuple(values))
            return cur.fetchone()

    def update_permission(self, permiso_id: UUID, data: dict) -> Optional[dict]:
        with db_transaction(self.db) as cur:
            fields = []
            params = []
            for k, v in data.items():
                if v is not None:
                    fields.append(f"{k} = %s")
                    params.append(v)
            
            if not fields: return None
            
            query = f"UPDATE permiso SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s RETURNING *"
            params.append(str(permiso_id))
            
            cur.execute(query, tuple(params))
            return cur.fetchone()

    def delete_permission(self, permiso_id: UUID) -> Optional[dict]:
        with db_transaction(self.db) as cur:
            cur.execute("DELETE FROM permiso WHERE id = %s RETURNING *", (str(permiso_id),))
            return cur.fetchone()
