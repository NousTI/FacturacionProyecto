from fastapi import Depends, HTTPException
from uuid import UUID
from datetime import date
from typing import List

from models.Modulo import ModuloCreate, ModuloUpdate, ModuloPlanCreate
from repositories.modulo_repository import ModuloRepository
from repositories.plan_repository import PlanRepository # To verify plan exists

class ModuloService:
    def __init__(
        self, 
        modulo_repo: ModuloRepository = Depends(),
        plan_repo: PlanRepository = Depends()
    ):
        self.modulo_repo = modulo_repo
        self.plan_repo = plan_repo

    # --- CRUD Modulo ---
    def list_all(self):
        return self.modulo_repo.get_all()

    def create(self, data: ModuloCreate):
        if self.modulo_repo.get_by_codigo(data.codigo):
            raise HTTPException(status_code=400, detail=f"El código '{data.codigo}' ya existe.")
        return self.modulo_repo.create(data.model_dump())

    def update(self, id: UUID, data: ModuloUpdate):
        mod = self.modulo_repo.get_by_id(id)
        if not mod:
             raise HTTPException(status_code=404, detail="Módulo no encontrado")
        return self.modulo_repo.update(id, data.model_dump(exclude_unset=True))

    def get_by_id(self, id: UUID):
        mod = self.modulo_repo.get_by_id(id)
        if not mod:
             raise HTTPException(status_code=404, detail="Módulo no encontrado")
        return mod

    def delete(self, id: UUID):
        if not self.modulo_repo.get_by_id(id):
             raise HTTPException(status_code=404, detail="Módulo no encontrado")
        return self.modulo_repo.delete(id)

    # --- Plan Linking ---
    def add_to_plan(self, plan_id: UUID, data: ModuloPlanCreate):
        plan = self.plan_repo.get_plan(plan_id)
        if not plan:
             raise HTTPException(status_code=404, detail="Plan no encontrado")
             
        # Verify module exists
        mod = self.modulo_repo.get_by_id(data.modulo_id)
        if not mod:
             raise HTTPException(status_code=404, detail="Módulo no encontrado")
             
        return self.modulo_repo.add_to_plan(plan_id, data.modulo_id, data.incluido)

    def remove_from_plan(self, plan_id: UUID, modulo_id: UUID):
        return self.modulo_repo.remove_from_plan(plan_id, modulo_id)

    def get_by_plan(self, plan_id: UUID):
        return self.modulo_repo.get_by_plan(plan_id)

    # --- Modulo Empresa (Manual) ---
    def add_modulo_to_empresa(self, empresa_id: UUID, modulo_id: UUID, activo: bool = True, fecha_vencimiento: date = None):
         # Verify modules exists
         if not self.modulo_repo.get_by_id(modulo_id):
             raise HTTPException(status_code=404, detail="Módulo no encontrado")
             
         data = {"activo": activo}
         if fecha_vencimiento:
             data["fecha_vencimiento"] = fecha_vencimiento
             
         # Try creating, if duplicate key, maybe we should update? Or let it fail. 
         # For manual assignment, fail if already exists is cleaner, forcing user to use update.
         # Actually, repository implementation is pure insert. Let's catch duplicate error or check first.
         existing = self.modulo_repo.get_modulo_empresa(empresa_id, modulo_id)
         if existing:
              raise HTTPException(status_code=400, detail="La empresa ya tiene este módulo asignado. Use actualizar.")
              
         return self.modulo_repo.create_modulo_empresa(empresa_id, modulo_id, data)

    def update_modulo_empresa(self, empresa_id: UUID, modulo_id: UUID, activo: bool = None, fecha_vencimiento: date = None):
         data = {}
         if activo is not None:
             data["activo"] = activo
         if fecha_vencimiento:
             data["fecha_vencimiento"] = fecha_vencimiento
             
         result = self.modulo_repo.update_modulo_empresa(empresa_id, modulo_id, data)
         if not result:
              raise HTTPException(status_code=404, detail="Asignación no encontrada")
         return result

    def remove_modulo_from_empresa(self, empresa_id: UUID, modulo_id: UUID):
         if not self.modulo_repo.delete_modulo_empresa(empresa_id, modulo_id):
              raise HTTPException(status_code=404, detail="Asignación no encontrada")
         return True

    def get_modules_for_empresa(self, empresa_id: UUID):
        return self.modulo_repo.get_all_for_empresa(empresa_id)

    # --- Empresa Sync ---
    def get_all_assignments(self):
        return self.modulo_repo.get_all_assignments()

    def sync_empresa_modules(self, empresa_id: UUID, plan_id: UUID, fecha_vencimiento: date):
        """
        Called by SuscripcionService when a Plan is activated/renewed.
        """
        count = self.modulo_repo.assign_plan_modules_to_empresa(empresa_id, plan_id, fecha_vencimiento)
        return {"assigned_count": count}

    def get_my_modules(self, empresa_id: UUID) -> List[dict]:
        return self.modulo_repo.get_active_for_empresa(empresa_id)
