from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioProductos:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_productos(self, empresa_id: Optional[UUID] = None, nombre: Optional[str] = None, codigo: Optional[str] = None) -> List[dict]:
        query = "SELECT * FROM sistema_facturacion.productos WHERE activo = TRUE"
        params = []
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))

        if nombre:
            query += " AND nombre ILIKE %s"
            params.append(f"%{nombre}%")
        if codigo:
            query += " AND codigo ILIKE %s"
            params.append(f"%{codigo}%")
            
        query += " ORDER BY created_at DESC"
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_id(self, producto_id: UUID) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.productos WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(producto_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def codigo_existe(self, codigo: str, empresa_id: UUID) -> bool:
        with self.db.cursor() as cur:
            cur.execute(
                "SELECT id FROM sistema_facturacion.productos WHERE codigo = %s AND empresa_id = %s", 
                (codigo, str(empresa_id))
            )
            return cur.fetchone() is not None

    def crear_producto(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.productos ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_producto(self, producto_id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(producto_id))

        query = f"UPDATE sistema_facturacion.productos SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id=%s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_producto(self, producto_id: UUID) -> bool:
        # Soft Delete
        query = "UPDATE sistema_facturacion.productos SET activo = FALSE, updated_at = NOW() WHERE id=%s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(producto_id),))
            return cur.rowcount > 0
