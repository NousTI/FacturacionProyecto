from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from models.Factura import FacturaCreate, FacturaUpdate
from typing import List, Optional

class FacturaRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create(self, data: FacturaCreate) -> Optional[dict]:
        query = """
            INSERT INTO factura (
                empresa_id, establecimiento_id, punto_emision_id, cliente_id, usuario_id,
                facturacion_programada_id, numero_factura, clave_acceso, fecha_emision,
                fecha_vencimiento, subtotal_sin_iva, subtotal_con_iva, iva, descuento,
                propina, total, estado, estado_pago, origen, observaciones
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING *
        """
        values = (
            str(data.empresa_id),
            str(data.establecimiento_id),
            str(data.punto_emision_id),
            str(data.cliente_id),
            str(data.usuario_id),
            str(data.facturacion_programada_id) if data.facturacion_programada_id else None,
            data.numero_factura,
            data.clave_acceso,
            data.fecha_emision,
            data.fecha_vencimiento,
            data.subtotal_sin_iva,
            data.subtotal_con_iva,
            data.iva,
            data.descuento,
            data.propina,
            data.total,
            data.estado,
            data.estado_pago,
            data.origen,
            data.observaciones
        )
        
        with db_transaction(self.db) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            return dict(row) if row else None

    def get_by_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM factura WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list(self, empresa_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[dict]:
        query = "SELECT * FROM factura"
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

    def update(self, id: UUID, data: FacturaUpdate) -> Optional[dict]:
        data_dict = data.model_dump(exclude_unset=True)
        if not data_dict:
            return self.get_by_id(id)

        fields = []
        values = []
        
        for key, value in data_dict.items():
            fields.append(f"{key} = %s")
            if isinstance(value, UUID):
                values.append(str(value))
            else:
                values.append(value)
        
        fields.append("updated_at = NOW()")
        values.append(str(id))

        query = f"UPDATE factura SET {', '.join(fields)} WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None
            
    def delete(self, id: UUID) -> bool:
         query = "DELETE FROM factura WHERE id = %s"
         with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
