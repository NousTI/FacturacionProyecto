from fastapi import Depends
from database.connection import get_db_connection
from database.transaction import db_transaction
from uuid import UUID
from datetime import date
from typing import List, Optional
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

    def exists_payment_with_comprobante(self, numero_comprobante: str, empresa_id: UUID) -> bool:
        if not self.db or not numero_comprobante: return False
        with self.db.cursor() as cur:
            query = "SELECT 1 FROM pago_suscripcion WHERE numero_comprobante = %s AND empresa_id = %s LIMIT 1"
            cur.execute(query, (numero_comprobante, str(empresa_id)))
            return cur.fetchone() is not None

    # ... previously defined registration method ...

    def list_pagos(self, empresa_id: UUID = None, estado: str = None, fecha_inicio: Optional[date] = None, fecha_fin: Optional[date] = None):
        if not self.db: return []
        
        query = """
            SELECT p.*, e.nombre_comercial as empresa_nombre, pl.nombre as plan_nombre
            FROM pago_suscripcion p
            JOIN empresa e ON p.empresa_id = e.id
            JOIN plan pl ON p.plan_id = pl.id
        """
        params = []
        conditions = []
        
        if empresa_id:
            conditions.append("p.empresa_id = %s")
            params.append(str(empresa_id))
            
        if estado:
            conditions.append("p.estado = %s")
            params.append(estado)

        if fecha_inicio:
            conditions.append("p.fecha_pago >= %s")
            params.append(fecha_inicio)

        if fecha_fin:
            conditions.append("p.fecha_pago <= %s")
            params.append(fecha_fin)
            
        if conditions:
             query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY p.fecha_pago DESC"
        
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
    def create_subscription_atomic(
        self, 
        pago_data: dict, 
        empresa_id: UUID, 
        new_empresa_status: str,
        fecha_activacion: date, 
        fecha_vencimiento: date, 
        cancel_previous_status: Optional[str] = None,
        target_previous_status: Optional[str] = None,
        comision_data: Optional[dict] = None
    ) -> Optional[dict]:
        """
        Registro atómico de suscripción:
        1. (Opcional) Cancela suscripciones previas si se proveen estados.
        2. Inserta el Pago.
        3. Actualiza la Empresa.
        4. (Opcional) Inserta Comisión.
        """
        if not self.db: return None
        
        # Serialize UUIDs for Pago
        # We explicitly list fields to ensure order and inclusion of new nullable fields if they are in the dict
        # But to be dynamic and safe, we can trust the keys of pago_data as long as they match DB columns.
        # However, to be extra safe with the new schema, let's ensure we handle UUIDs correctly.
        
        p_fields = list(pago_data.keys())
        p_clean_values = [str(v) if isinstance(v, UUID) else v for v in pago_data.values()]
        p_placeholders = ["%s"] * len(p_fields)
        
        insert_pago_query = f"""
            INSERT INTO pago_suscripcion ({', '.join(p_fields)})
            VALUES ({', '.join(p_placeholders)})
            RETURNING *
        """

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
                # 1. Cancel previous if requested
                if cancel_previous_status and target_previous_status:
                    cancel_query = """
                        UPDATE pago_suscripcion
                        SET estado = %s, updated_at = NOW()
                        WHERE empresa_id = %s AND estado = %s
                    """
                    cur.execute(cancel_query, (cancel_previous_status, str(empresa_id), target_previous_status))

                # 2. Insert Pago
                cur.execute(insert_pago_query, tuple(p_clean_values))
                pago_row = cur.fetchone()
                pago_id = pago_row['id']
                
                # 3. Update Empresa
                cur.execute(update_empresa_query, (
                    fecha_activacion, 
                    fecha_vencimiento, 
                    new_empresa_status, 
                    str(empresa_id)
                ))
                
                # 4. Insert Comision if data present
                if comision_data:
                    comision_data['pago_suscripcion_id'] = str(pago_id)
                    c_fields = list(comision_data.keys())
                    c_clean_values = [str(v) if isinstance(v, UUID) else v for v in comision_data.values()]
                    c_placeholders = ["%s"] * len(c_fields)
                            
                    insert_comision_query = f"""
                        INSERT INTO comision ({', '.join(c_fields)})
                        VALUES ({', '.join(c_placeholders)})
                    """
                    cur.execute(insert_comision_query, tuple(c_clean_values))

                return dict(pago_row) if pago_row else None
        except Exception as e:
            # Check for specific psycopg2 errors if possible, or string match
            error_str = str(e)
            if "fk_pago_suscripcion_registrado_por" in error_str:
                # We can't raise HTTPException here easily because we are in repo (bad practice to raise HTTP in repo layers usually, but practical here for quick fix).
                # Better: Re-raise as ValueError with specific message, let Service catch it?
                # Or just let Service handle it. But User asked specifically "arregla la excepcion con su mensaje".
                # I will raise a specific ValueError that Service/Main can catch or just modify exception detail?
                # Actually, standard practice: Let it bubble up but maybe wrap it?
                # Given user context (User asked for clearer message). I'll re-raise with clearer message.
                raise Exception("El usuario especificado en 'registrado_por' no existe.") from e
            if "fk_pago_suscripcion_empresa_id" in error_str:
                raise Exception("La empresa especificada no existe.") from e
            if "fk_pago_suscripcion_plan_id" in error_str:
                raise Exception("El plan especificado no existe.") from e
                
            print(f"Transaction failed: {e}")
            raise e

    def approve_subscription(self, pago_id: UUID, empresa_id: UUID, fecha_activacion: date, fecha_vencimiento: date, comision_data: dict = None) -> bool:
        """
        Approves a PENDING payment:
        1. Sets Payment status to COMPLETED.
        2. Sets Company status to ACTIVA and updates dates.
        3. Generates Commission (optional).
        """
        if not self.db: return False
        
        try:
            with db_transaction(self.db) as cur:
                # 1. Update Payment
                cur.execute(
                    "UPDATE pago_suscripcion SET estado = 'COMPLETED', updated_at = NOW() WHERE id = %s",
                    (str(pago_id),)
                )
                
                # 2. Update Empresa
                cur.execute("""
                    UPDATE empresa 
                    SET estado_suscripcion = 'ACTIVA', 
                        fecha_activacion = %s, 
                        fecha_vencimiento = %s, 
                        updated_at = NOW() 
                    WHERE id = %s
                """, (fecha_activacion, fecha_vencimiento, str(empresa_id)))
                
                # 3. Create Commission
                if comision_data:
                    comision_data['pago_suscripcion_id'] = str(pago_id)
                    c_fields = list(comision_data.keys())
                    c_clean_values = [str(v) if isinstance(v, UUID) else v for v in comision_data.values()]
                    c_placeholders = ["%s"] * len(c_fields)
                    
                    insert_comision_query = f"""
                        INSERT INTO comision ({', '.join(c_fields)})
                        VALUES ({', '.join(c_placeholders)})
                    """
                    cur.execute(insert_comision_query, tuple(c_clean_values))
                    
            return True
        except Exception as e:
            print(f"Approval failed: {e}")
            raise e

    def update_pago_status(self, pago_id: UUID, nuevo_estado: str, observaciones: str = None) -> bool:
        if not self.db: return False
        query = "UPDATE pago_suscripcion SET estado = %s, updated_at = NOW()"
        params = [nuevo_estado]
        if observaciones:
            query += ", observaciones = %s"
            params.append(observaciones)
        query += " WHERE id = %s"
        params.append(str(pago_id))
        
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(params))
            return cur.rowcount > 0
