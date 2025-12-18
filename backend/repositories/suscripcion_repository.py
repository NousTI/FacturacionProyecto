from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from models.Suscripcion import PagoSuscripcionCreate

class SuscripcionRepository:
    def __init__(self, db=Depends(get_db_connection)):
        self.db = db

    def get_rol_codigo(self, rol_id: UUID):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT codigo FROM rol WHERE id = %s", (str(rol_id),))
            row = cur.fetchone()
            return row["codigo"] if row else None

    # ... previously defined registration method ...

    def list_pagos(self, empresa_id: UUID = None, estado: str = None):
        if not self.db: return []
        
        query = "SELECT * FROM pago_suscripcion"
        params = []
        conditions = []
        
        if empresa_id:
            conditions.append("empresa_id = %s")
            params.append(str(empresa_id))
            
        if estado:
            conditions.append("estado = %s")
            params.append(estado)
            
        if conditions:
             query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY fecha_pago DESC"
        
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

    def get_pago_by_id(self, pago_id: UUID):
        if not self.db: return None
        with self.db.cursor() as cur:
            cur.execute("SELECT * FROM pago_suscripcion WHERE id = %s", (str(pago_id),))
            row = cur.fetchone()
            return dict(row) if row else None
    def registrar_suscripcion(self, pago_data: dict, empresa_id: UUID, plan_id: UUID, fecha_activacion, fecha_vencimiento, comision_data: dict = None):
        if not self.db: return None
        
        # Prepare Pago Insert
        p_fields = list(pago_data.keys())
        p_values = list(pago_data.values())
        p_placeholders = ["%s"] * len(p_fields)
        
        p_clean_values = []
        for v in p_values:
            if isinstance(v, UUID):
                p_clean_values.append(str(v))
            else:
                p_clean_values.append(v)
        
        insert_pago_query = f"""
            INSERT INTO pago_suscripcion ({', '.join(p_fields)})
            VALUES ({', '.join(p_placeholders)})
            RETURNING id, periodo_inicio, periodo_fin, monto
        """
        # Note: returning * is fine, usually we just need ID for foreign key.
        # Adjusted to just rely on the ID from previous pattern or fetchone dict for simplicity.
        insert_pago_query = f"""
            INSERT INTO pago_suscripcion ({', '.join(p_fields)})
            VALUES ({', '.join(p_placeholders)})
            RETURNING *
        """

        from utils.enums import SubscriptionStatus

        update_empresa_query = """
            UPDATE empresa
            SET 
                fecha_activacion = %s,
                fecha_vencimiento = %s,
                estado_suscripcion = %s,
                updated_at = NOW()
            WHERE id = %s
        """
        
        try:
            with db_transaction(self.db) as cur:
                # 0. Cancel previous active subscriptions to cleanly switch plan/period
                cancel_previous_query = """
                    UPDATE pago_suscripcion
                    SET estado = %s, updated_at = NOW()
                    WHERE empresa_id = %s AND estado = %s
                """
                cur.execute(cancel_previous_query, (
                    SubscriptionStatus.CANCELADA.value, 
                    str(empresa_id), 
                    SubscriptionStatus.ACTIVA.value
                ))

                # 1. Insert Pago
                cur.execute(insert_pago_query, tuple(p_clean_values))
                pago_row = cur.fetchone()
                pago_id = pago_row['id']
                
                # 2. Update Empresa
                cur.execute(update_empresa_query, (
                    fecha_activacion, 
                    fecha_vencimiento, 
                    SubscriptionStatus.ACTIVA.value, 
                    str(empresa_id)
                ))
                
                # 3. Insert Part: Comision (if applicable)
                if comision_data:
                    # Link comision to the newly created pago_id
                    comision_data['pago_suscripcion_id'] = str(pago_id)
                    
                    c_fields = list(comision_data.keys())
                    c_values = list(comision_data.values())
                    c_placeholders = ["%s"] * len(c_fields)
                    
                    c_clean_values = []
                    for v in c_values:
                        if isinstance(v, UUID):
                            c_clean_values.append(str(v))
                        else:
                            c_clean_values.append(v)
                            
                    insert_comision_query = f"""
                        INSERT INTO comision ({', '.join(c_fields)})
                        VALUES ({', '.join(c_placeholders)})
                    """
                    cur.execute(insert_comision_query, tuple(c_clean_values))

                return dict(pago_row) if pago_row else None
        except Exception as e:
            print(f"Transaction failed: {e}")
            raise e
