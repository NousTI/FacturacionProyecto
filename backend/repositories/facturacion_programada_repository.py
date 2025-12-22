from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from models.FacturaProgramada import FacturaProgramadaCreate, FacturaProgramadaUpdate
from typing import List, Optional
import json

class FacturacionProgramadaRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create(self, factura_data: FacturaProgramadaCreate, empresa_id: UUID) -> Optional[dict]:
        query = """
            INSERT INTO facturacion_programada (
                empresa_id, cliente_id, usuario_id, tipo_frecuencia, dia_emision,
                monto, concepto, fecha_inicio, fecha_fin, activo, enviar_email, configuracion
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        values = (
            str(empresa_id),
            str(factura_data.cliente_id),
            str(factura_data.usuario_id),
            factura_data.tipo_frecuencia,
            factura_data.dia_emision,
            factura_data.monto,
            factura_data.concepto,
            factura_data.fecha_inicio,
            factura_data.fecha_fin,
            factura_data.activo,
            factura_data.enviar_email,
            json.dumps(factura_data.configuracion) if factura_data.configuracion else None
        )
        
        with db_transaction(self.db) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            return dict(row) if row else None

    def get_by_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM facturacion_programada WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list(self, empresa_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        query = "SELECT * FROM facturacion_programada"
        params = []
        
        if empresa_id:
            query += " WHERE empresa_id = %s"
            params.append(str(empresa_id))
            
        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update(self, id: UUID, factura_data: FacturaProgramadaUpdate) -> Optional[dict]:
        # Dynamic update query construction
        fields = []
        values = []
        
        data_dict = factura_data.model_dump(exclude_unset=True)
        
        if not data_dict:
            return self.get_by_id(id)

        for key, value in data_dict.items():
            fields.append(f"{key} = %s")
            if key == 'configuracion' and value is not None:
                values.append(json.dumps(value))
            elif isinstance(value, UUID):
                values.append(str(value))
            else:
                values.append(value)
                
        fields.append("updated_at = NOW()")
        
        query = f"UPDATE facturacion_programada SET {', '.join(fields)} WHERE id = %s RETURNING *"
        values.append(str(id))
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete(self, id: UUID) -> bool:
        query = "DELETE FROM facturacion_programada WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
