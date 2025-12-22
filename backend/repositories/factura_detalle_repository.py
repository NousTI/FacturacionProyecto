from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from models.FacturaDetalle import FacturaDetalleCreate, FacturaDetalleUpdate
from typing import List, Optional

class FacturaDetalleRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def create(self, data: FacturaDetalleCreate) -> Optional[dict]:
        query = """
            INSERT INTO factura_detalle (
                factura_id, producto_id, codigo_producto, descripcion, cantidad, 
                precio_unitario, descuento, subtotal, tipo_iva, valor_iva, cost_unitario
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING *
        """
        # Note: 'cost_unitario' typo in query vs 'costo_unitario' in DB schema?
        # User schema in Step 386 says: costo_unitario NUMERIC(12,2),
        # My model says: costo_unitario.
        # I need to be careful with column name. Schema: costo_unitario.
        
        query = """
            INSERT INTO factura_detalle (
                factura_id, producto_id, codigo_producto, descripcion, cantidad, 
                precio_unitario, descuento, subtotal, tipo_iva, valor_iva, costo_unitario
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING *
        """
        
        values = (
            str(data.factura_id),
            str(data.producto_id) if data.producto_id else None,
            data.codigo_producto,
            data.descripcion,
            data.cantidad,
            data.precio_unitario,
            data.descuento,
            data.subtotal,
            data.tipo_iva,
            data.valor_iva,
            data.costo_unitario
        )
        
        with db_transaction(self.db) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            return dict(row) if row else None

    def get_by_id(self, id: UUID) -> Optional[dict]:
        query = "SELECT * FROM factura_detalle WHERE id = %s"
        with self.db.cursor() as cur:
            cur.execute(query, (str(id),))
            row = cur.fetchone()
            return dict(row) if row else None

    def list_by_factura(self, factura_id: UUID) -> List[dict]:
        query = "SELECT * FROM factura_detalle WHERE factura_id = %s ORDER BY created_at ASC"
        with self.db.cursor() as cur:
            cur.execute(query, (str(factura_id),))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def update(self, id: UUID, data: FacturaDetalleUpdate) -> Optional[dict]:
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

        query = f"UPDATE factura_detalle SET {', '.join(fields)} WHERE id = %s RETURNING *"
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(values))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete(self, id: UUID) -> bool:
        query = "DELETE FROM factura_detalle WHERE id = %s"
        with db_transaction(self.db) as cur:
            cur.execute(query, (str(id),))
            return cur.rowcount > 0
