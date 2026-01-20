from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioProveedores:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_proveedores(self, empresa_id: Optional[UUID] = None) -> List[dict]:
        query = "SELECT * FROM proveedor WHERE activo = TRUE"
        params = []
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
            
        query += " ORDER BY created_at DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_id(self, proveedor_id: UUID) -> Optional[dict]:
        query = "SELECT * FROM proveedor WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(proveedor_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def identificacion_existe(self, identificacion: str, empresa_id: UUID) -> bool:
        with self.db.cursor() as cur:
            cur.execute(
                "SELECT id FROM proveedor WHERE identificacion = %s AND empresa_id = %s", 
                (identificacion, str(empresa_id))
            )
            return cur.fetchone() is not None

    def crear_proveedor(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO proveedor ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_proveedor(self, proveedor_id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(proveedor_id))

        query = f"UPDATE proveedor SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_proveedor(self, proveedor_id: UUID) -> bool:
        # Soft Delete
        query = "UPDATE proveedor SET activo = FALSE, updated_at = NOW() WHERE id=%s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(proveedor_id),))
            return cur.rowcount > 0
