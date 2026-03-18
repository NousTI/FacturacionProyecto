from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioCuentasCobrar:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def crear_cuenta(self, data: dict) -> Optional[dict]:
        fields = list(data.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.cuentas_cobrar ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def obtener_por_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM sistema_facturacion.cuentas_cobrar WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def listar_cuentas(self, empresa_id: Optional[UUID] = None, cliente_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        query = "SELECT * FROM sistema_facturacion.cuentas_cobrar"
        params = []
        conditions = []
        
        if empresa_id:
            conditions.append("empresa_id = %s")
            params.append(str(empresa_id))
            
        if cliente_id:
            conditions.append("cliente_id = %s")
            params.append(str(cliente_id))
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def actualizar_cuenta(self, id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(id))

        query = f"UPDATE sistema_facturacion.cuentas_cobrar SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def actualizar_por_factura(self, factura_id: UUID, data: dict) -> Optional[dict]:
        if not data: return None
        
        set_clauses = [f"{key} = %s" for key in data.keys()]
        clean_values = [str(v) if isinstance(v, UUID) else v for v in data.values()]
        clean_values.append(str(factura_id))

        query = f"UPDATE sistema_facturacion.cuentas_cobrar SET {', '.join(set_clauses)}, updated_at = NOW() WHERE factura_id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(clean_values))
            row = cur.fetchone()
            return dict(row) if row else None

    def eliminar_cuenta(self, id: UUID) -> bool:
        query = "DELETE FROM sistema_facturacion.cuentas_cobrar WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
