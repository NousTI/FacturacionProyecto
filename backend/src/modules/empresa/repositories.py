from fastapi import Depends
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioEmpresas:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def _serialize_uuids(self, values: list) -> list:
        return [str(v) if isinstance(v, UUID) else v for v in values]

    def crear_empresa(self, data: dict) -> Optional[dict]:
        if not self.db: return None
        fields = list(data.keys())
        # Ensure UUIDs are strings
        clean_values = self._serialize_uuids(list(data.values()))
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.empresas ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, empresa_id: UUID) -> Optional[dict]:
        query = """
            SELECT e.*, 
            (SELECT v.nombres || ' ' || v.apellidos FROM sistema_facturacion.vendedores v WHERE v.id = e.vendedor_id) as vendedor_name
            FROM sistema_facturacion.empresas e 
            WHERE e.id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_ruc(self, ruc: str) -> Optional[dict]:
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM sistema_facturacion.empresas WHERE ruc=%s", (ruc,))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_empresas(self, vendedor_id: Optional[UUID] = None, empresa_id: Optional[UUID] = None) -> List[dict]:
        query = """
            SELECT e.*, 
            (SELECT v.nombres || ' ' || v.apellidos FROM sistema_facturacion.vendedores v WHERE v.id = e.vendedor_id) as vendedor_name
            FROM sistema_facturacion.empresas e
        """
        params = []
        conditions = []
        
        if vendedor_id:
            conditions.append("e.vendedor_id = %s")
            params.append(str(vendedor_id))
            
        if empresa_id:
            conditions.append("e.id = %s")
            params.append(str(empresa_id))
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY e.created_at DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_estadisticas(self, vendedor_id: Optional[UUID] = None) -> dict:
        query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE activo = true) as activas,
                COUNT(*) FILTER (WHERE activo = false) as inactivas
            FROM sistema_facturacion.empresas
        """
        params = []
        if vendedor_id:
            query += " WHERE vendedor_id = %s"
            params.append(str(vendedor_id))
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            return dict(row) if row else {"total": 0, "activas": 0, "inactivas": 0}

    def actualizar_empresa(self, empresa_id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = self._serialize_uuids(list(data.values()))
        clean_values.append(str(empresa_id))
        
        query = f"""
            UPDATE sistema_facturacion.empresas 
            SET {', '.join(set_clauses)}, updated_at = NOW() 
            WHERE id = %s
            RETURNING *
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def check_expired_subscriptions(self, tolerance_days: int = 0) -> int:
        query = """
            UPDATE sistema_facturacion.suscripciones 
            SET estado = 'VENCIDA', updated_at = NOW() 
            WHERE estado = 'ACTIVA' 
            AND (fecha_fin + (interval '1 day' * %s)) < NOW()
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, (tolerance_days,))
            return cur.rowcount

    def eliminar_empresa(self, empresa_id: UUID) -> bool:
        query = "DELETE FROM sistema_facturacion.empresas WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(empresa_id),))
            return cur.rowcount > 0

    def create_manual_subscription(self, data: dict) -> bool:
        # Note: data must contain correct string/values.
        cleaned_data = self._serialize_uuids(list(data.values()))
        keys = list(data.keys())
        placeholders = ["%s"] * len(keys)
        
        query = f"""
            INSERT INTO sistema_facturacion.pagos_suscripciones ({', '.join(keys)})
            VALUES ({', '.join(placeholders)})
        """
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(cleaned_data))
            return cur.rowcount > 0
