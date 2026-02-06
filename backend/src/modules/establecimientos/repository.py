from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioEstablecimientos:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_establecimiento(self, data: dict, empresa_id: UUID) -> Optional[dict]:
        fields = list(data.keys())
        if "empresa_id" not in fields:
             fields.append("empresa_id")
             values = list(data.values())
             values.append(str(empresa_id))
        else:
             values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
             
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.establecimientos ({', '.join(fields)})
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
                e.*,
                COALESCE(COUNT(pe.id), 0) as puntos_emision_total,
                COALESCE(MAX(pe.secuencial_actual), 0) as ultimo_secuencial
            FROM sistema_facturacion.establecimientos e
            LEFT JOIN sistema_facturacion.puntos_emision pe ON e.id = pe.establecimiento_id
            WHERE e.id = %s
            GROUP BY e.id
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_establecimientos(self, empresa_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        query = """
            SELECT 
                e.*,
                COALESCE(COUNT(pe.id), 0) as puntos_emision_total,
                COALESCE(MAX(pe.secuencial_actual), 0) as ultimo_secuencial
            FROM sistema_facturacion.establecimientos e
            LEFT JOIN sistema_facturacion.puntos_emision pe ON e.id = pe.establecimiento_id
        """
        params = []
        
        if empresa_id:
            query += " WHERE e.empresa_id = %s"
            params.append(str(empresa_id))
            
        query += " GROUP BY e.id ORDER BY e.codigo ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def actualizar_establecimiento(self, id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(id))

        query = f"UPDATE sistema_facturacion.establecimientos SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_establecimiento(self, id: UUID) -> bool:
        query = "DELETE FROM sistema_facturacion.establecimientos WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0

    def obtener_estadisticas(self, empresa_id: Optional[UUID] = None) -> dict:
        """Obtiene estadísticas de establecimientos"""
        base_query = """
            SELECT 
                e.id,
                e.activo,
                COALESCE(COUNT(pe.id), 0) as puntos_emision_count
            FROM sistema_facturacion.establecimientos e
            LEFT JOIN sistema_facturacion.puntos_emision pe ON e.id = pe.establecimiento_id
        """
        params = []
        
        if empresa_id:
            base_query += " WHERE e.empresa_id = %s"
            params.append(str(empresa_id))

        base_query += " GROUP BY e.id, e.activo"

        with self.db.cursor() as cur:
            cur.execute(base_query, tuple(params))
            establecimientos = cur.fetchall()
            
            total = len(establecimientos)
            activos = sum(1 for e in establecimientos if e.get('activo', False))
            con_puntos_emision = sum(1 for e in establecimientos if e.get('puntos_emision_count', 0) > 0)
            
            return {
                'total': total,
                'activos': activos,
                'con_puntos_emision': con_puntos_emision
            }
