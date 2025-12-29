from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from datetime import date
from database.connection import get_db_connection

class ModuloRepository:
    def __init__(self, db_connection=Depends(get_db_connection)):
        self.conn = db_connection
        self.cursor = self.conn.cursor()

    def get_all(self) -> List[dict]:
        self.cursor.execute("SELECT * FROM modulo ORDER BY orden ASC")
        return self.cursor.fetchall()

    def get_by_id(self, modulo_id: UUID) -> Optional[dict]:
        self.cursor.execute("SELECT * FROM modulo WHERE id = %s", (str(modulo_id),))
        return self.cursor.fetchone()
        
    def get_by_codigo(self, codigo: str) -> Optional[dict]:
        self.cursor.execute("SELECT * FROM modulo WHERE codigo = %s", (codigo,))
        return self.cursor.fetchone()

    def create(self, data: dict) -> dict:
        columns = list(data.keys())
        values = list(data.values())
        placeholders = ["%s"] * len(values)
        
        query = f"""
            INSERT INTO modulo ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        self.cursor.execute(query, values)
        self.conn.commit()
        return self.cursor.fetchone()

    def update(self, modulo_id: UUID, data: dict) -> Optional[dict]:
        if not data: return self.get_by_id(modulo_id)
        
        set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
        values = list(data.values())
        values.append(str(modulo_id))
        
        query = f"UPDATE modulo SET {set_clause}, updated_at = NOW() WHERE id = %s RETURNING *"
        self.cursor.execute(query, values)
        self.conn.commit()
        return self.cursor.fetchone()

    def delete(self, modulo_id: UUID):
        self.cursor.execute("DELETE FROM modulo WHERE id = %s", (str(modulo_id),))
        self.conn.commit()
        return self.cursor.rowcount > 0

    # --- Modulo Plan ---
    def add_to_plan(self, plan_id: UUID, modulo_id: UUID, incluido: bool = True):
        self.cursor.execute("""
            INSERT INTO modulo_plan (plan_id, modulo_id, incluido, created_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (plan_id, modulo_id) 
            DO UPDATE SET incluido = EXCLUDED.incluido, updated_at = NOW()
            RETURNING *
        """, (str(plan_id), str(modulo_id), incluido))
        self.conn.commit()
        return self.cursor.fetchone()

    def remove_from_plan(self, plan_id: UUID, modulo_id: UUID):
        self.cursor.execute("""
            DELETE FROM modulo_plan WHERE plan_id = %s AND modulo_id = %s
        """, (str(plan_id), str(modulo_id)))
        self.conn.commit()
        return self.cursor.rowcount > 0

    def get_by_plan(self, plan_id: UUID) -> List[dict]:
        """Returns modules linked to a plan + module details."""
        query = """
            SELECT mp.*, m.nombre as modulo_nombre, m.codigo as modulo_codigo
            FROM modulo_plan mp
            JOIN modulo m ON mp.modulo_id = m.id
            WHERE mp.plan_id = %s
        """
        self.cursor.execute(query, (str(plan_id),))
        return self.cursor.fetchall()

    # --- Modulo Empresa (Manual Management) ---
    def create_modulo_empresa(self, empresa_id: UUID, modulo_id: UUID, data: dict):
        columns = ["empresa_id", "modulo_id"]
        values = [str(empresa_id), str(modulo_id)]
        placeholders = ["%s", "%s"]
        
        for key, value in data.items():
            columns.append(key)
            values.append(value)
            placeholders.append("%s")
        
        query = f"""
            INSERT INTO modulo_empresa ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        self.cursor.execute(query, tuple(values))
        self.conn.commit()
        return self.cursor.fetchone()

    def update_modulo_empresa(self, empresa_id: UUID, modulo_id: UUID, data: dict):
        if not data:
            return None
            
        set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
        values = list(data.values())
        values.extend([str(empresa_id), str(modulo_id)])
        
        query = f"""
            UPDATE modulo_empresa 
            SET {set_clause}, updated_at = NOW() 
            WHERE empresa_id = %s AND modulo_id = %s 
            RETURNING *
        """
        self.cursor.execute(query, tuple(values))
        self.conn.commit()
        return self.cursor.fetchone()

    def delete_modulo_empresa(self, empresa_id: UUID, modulo_id: UUID):
        self.cursor.execute("""
            DELETE FROM modulo_empresa WHERE empresa_id = %s AND modulo_id = %s
        """, (str(empresa_id), str(modulo_id)))
        self.conn.commit()
        return self.cursor.rowcount > 0

    def get_modulo_empresa(self, empresa_id: UUID, modulo_id: UUID):
         self.cursor.execute("""
            SELECT * FROM modulo_empresa WHERE empresa_id = %s AND modulo_id = %s
        """, (str(empresa_id), str(modulo_id)))
         return self.cursor.fetchone()

    def get_all_for_empresa(self, empresa_id: UUID) -> List[dict]:
        """Returns ALL modules linked to an empresa (active or not)."""
        self.cursor.execute("""
            SELECT me.*, m.nombre as modulo_nombre, m.codigo as modulo_codigo, m.icono as modulo_icono
            FROM modulo_empresa me
            JOIN modulo m ON me.modulo_id = m.id
            WHERE me.empresa_id = %s
        """, (str(empresa_id),))
        return self.cursor.fetchall()

    def get_all_assignments(self) -> List[dict]:
        """Returns ALL modulo_empresa records across ALL companies."""
        query = """
            SELECT me.*, m.nombre as modulo_nombre, m.codigo as modulo_codigo, m.icono as modulo_icono
            FROM modulo_empresa me
            JOIN modulo m ON me.modulo_id = m.id
        """
        self.cursor.execute(query)
        return self.cursor.fetchall()

    # --- Modulo Empresa (Synchronization) ---
    def assign_plan_modules_to_empresa(self, empresa_id: UUID, plan_id: UUID, fecha_vencimiento: date):
        """
        Syncs modules: Takes all modules from the plan and inserts/updates them for the empresa.
        Sets active=TRUE and updates expiration date.
        """
        # 1. Get Modules in Plan
        modules_in_plan = self.get_by_plan(plan_id)
        
        if not modules_in_plan:
            return 0
            
        count = 0
        for mod in modules_in_plan:
             if mod['incluido']:
                 self.cursor.execute("""
                    INSERT INTO modulo_empresa (empresa_id, modulo_id, activo, fecha_activacion, fecha_vencimiento)
                    VALUES (%s, %s, TRUE, CURRENT_DATE, %s)
                    ON CONFLICT (empresa_id, modulo_id) DO UPDATE 
                    SET activo = TRUE, fecha_vencimiento = EXCLUDED.fecha_vencimiento, updated_at = NOW()
                 """, (str(empresa_id), str(mod['modulo_id']), fecha_vencimiento))
                 count += 1
        
        # Note: We do NOT deactivate modules that are NOT in the plan here. 
        # Strategy: Additive. If they downgrade, maybe we should? 
        # For now, simplistic approach: Grant what is in the plan.
        
        self.conn.commit()
        return count

    def get_active_for_empresa(self, empresa_id: UUID) -> List[dict]:
        query = """
            SELECT me.*, m.nombre as modulo_nombre, m.codigo as modulo_codigo, m.icono as modulo_icono, m.categoria
            FROM modulo_empresa me
            JOIN modulo m ON me.modulo_id = m.id
            WHERE me.empresa_id = %s 
              AND me.activo = TRUE 
              AND m.activo = TRUE
              AND (me.fecha_vencimiento IS NULL OR me.fecha_vencimiento >= CURRENT_DATE)
            ORDER BY m.orden ASC
        """
        self.cursor.execute(query, (str(empresa_id),))
        return self.cursor.fetchall()
