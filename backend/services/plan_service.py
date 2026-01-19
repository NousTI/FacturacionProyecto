from fastapi import Depends, HTTPException, status
from uuid import UUID
from typing import List, Optional
from repositories.plan_repository import PlanRepository
from models.Plan import PlanCreate, PlanUpdate

class PlanService:
    def __init__(self, plan_repo: PlanRepository = Depends()):
        self.plan_repo = plan_repo

    def create_plan(self, plan: PlanCreate) -> dict:
        # Check if code already exists
        if self.plan_repo.get_plan_by_codigo(plan.codigo):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El plan con código '{plan.codigo}' ya existe"
            )
        
        return self.plan_repo.create_plan(plan.model_dump())

    def get_plan(self, plan_id: UUID) -> dict:
        plan = self.plan_repo.get_plan(plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan no encontrado"
            )
        return plan

    def list_plans(self) -> List[dict]:
        plans = self.plan_repo.list_plans()
        print(f"DEBUG: Listing plans in order: {[p['nombre'] for p in plans]}")
        return plans

    def update_plan(self, plan_id: UUID, plan_update: PlanUpdate) -> dict:
        # Check if plan exists
        existing_plan = self.plan_repo.get_plan(plan_id)
        if not existing_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan no encontrado"
            )

        # Update data
        update_data = plan_update.model_dump(exclude_unset=True)
        if not update_data:
            return existing_plan

        # Check code uniqueness if changing code
        if 'codigo' in update_data and update_data['codigo'] != existing_plan['codigo']:
            if self.plan_repo.get_plan_by_codigo(update_data['codigo']):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"El plan con código '{update_data['codigo']}' ya existe"
                )

        updated_plan = self.plan_repo.update_plan(plan_id, update_data)
        if not updated_plan:
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar el plan"
            )
        return updated_plan

    def delete_plan(self, plan_id: UUID) -> bool:
        # Check if plan exists
        if not self.plan_repo.get_plan(plan_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan no encontrado"
            )
            
        success = self.plan_repo.delete_plan(plan_id)
        if not success:
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar el plan"
            )
        return True

    def get_companies_by_plan(self, plan_id: UUID) -> List[dict]:
        # Check if plan exists
        if not self.plan_repo.get_plan(plan_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan no encontrado"
            )
        return self.plan_repo.get_companies_by_plan(plan_id)

    def reorder_plans(self, order_updates: List[dict]) -> bool:
        # order_updates: list of {'id': UUID, 'orden': int}
        updates_tuple = []
        print(f"DEBUG: Reordering plans with updates: {order_updates}")
        for item in order_updates:
            if 'id' in item and 'orden' in item:
                updates_tuple.append((item['id'], item['orden']))
        
        if not updates_tuple:
            print("DEBUG: No valid updates found in reorder_plans")
            return False

        result = self.plan_repo.update_plan_order(updates_tuple)
        print(f"DEBUG: Reorder result: {result}")
        return result
