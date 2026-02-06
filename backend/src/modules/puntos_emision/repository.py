from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioPuntosEmision:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_punto(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.puntos_emision ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = """
            SELECT 
                pe.*,
                e.nombre as establecimiento_nombre
            FROM sistema_facturacion.puntos_emision pe
            LEFT JOIN sistema_facturacion.establecimientos e ON pe.establecimiento_id = e.id
            WHERE pe.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_puntos(self, establecimiento_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        query = """
            SELECT 
                pe.*,
                e.nombre as establecimiento_nombre
            FROM sistema_facturacion.puntos_emision pe
            LEFT JOIN sistema_facturacion.establecimientos e ON pe.establecimiento_id = e.id
        """
        params = []
        
        if establecimiento_id:
            query += " WHERE pe.establecimiento_id = %s"
            params.append(str(establecimiento_id))
            
        query += " ORDER BY pe.codigo ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def actualizar_punto(self, id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(id))

        query = f"UPDATE sistema_facturacion.puntos_emision SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_punto(self, id: UUID) -> bool:
        query = "DELETE FROM sistema_facturacion.puntos_emision WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def incrementar_secuencial(self, id: UUID) -> Optional[int]:
        query = "UPDATE sistema_facturacion.puntos_emision SET secuencial_actual = secuencial_actual + 1, updated_at = NOW() WHERE id = %s RETURNING secuencial_actual"
        with db_transaction(self.db) as cur:
             cur.execute(query, (str(id),))
             row = cur.fetchone()
             if row:
                  # Safe access for different cursor types
                  try: return row['secuencial_actual'] - 1
                  except: return row[0] - 1
        return None
