from fastapi import Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID

from repositories.reporte_generado_repository import ReporteGeneradoRepository
from models.ReporteGenerado import ReporteGeneradoCreate, ReporteGeneradoUpdate, ReporteGeneradoRead
from utils.enums import PermissionCodes, AuthKeys

class ReporteGeneradoService:
    def __init__(self, repository: ReporteGeneradoRepository = Depends()):
        self.repository = repository

    def create(self, data: ReporteGeneradoCreate, current_user: dict) -> ReporteGeneradoRead:
        # Determine Context
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        user_empresa_id = current_user.get('empresa_id')
        user_id = current_user.get('id') if current_user.get('id') else current_user.get('sub')
        
        if not is_superadmin and not user_empresa_id:
             raise HTTPException(status_code=400, detail="User context required")

        # Superadmin can behave as user if context is set, but let's assume current context
        # If Superadmin has no empresa context, what do they report on? 
        # Usually reports are GLOBAL or PER COMPANY. if global, empresa_id might be null?
        # Schema says "empresa_id UUID NOT NULL". So it MUST be linked to an entity.
        # If Superadmin creating for a specific company, they should impersonate or provide ID.
        # For MVP: Assume Superadmin has 'empresa_id' in context (Impersonation) OR we default to a "System" ID?
        # Schema constraint: NOT NULL.
        # So Superadmin MUST specify or have context.
        
        target_empresa_id = user_empresa_id
        if is_superadmin:
             # Check if provided in body first, else use context
             if data.empresa_id:
                 target_empresa_id = data.empresa_id
        
        if not target_empresa_id:
             raise HTTPException(status_code=400, detail="Company context required (specify 'empresa_id' or use impersonation).")

        # Determine User ID
        target_usuario_id = user_id
        if is_superadmin:
             # Superadmin must specify a valid user ID (since table has FK to public.usuario)
             if data.usuario_id:
                 target_usuario_id = data.usuario_id
             else:
                 raise HTTPException(status_code=400, detail="Superadmin must specify 'usuario_id' when generating a report.")

        # Prepare Data
        raw_data = data.dict(exclude={'usuario_id'}) # exclude to re-add correct one
        raw_data['empresa_id'] = target_empresa_id
        raw_data['usuario_id'] = target_usuario_id
        
        created = self.repository.create(raw_data)
        if not created:
             raise HTTPException(status_code=500, detail="Error generating report")
        return ReporteGeneradoRead(**created)

    def list(self, current_user: dict, limit: int = 20, offset: int = 0) -> List[ReporteGeneradoRead]:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        user_empresa_id = current_user.get('empresa_id')
        
        target_empresa_id = user_empresa_id if not is_superadmin else None # Superadmin sees ALL if no context?
        # If Superadmin wants to see all, pass None. If impersonating, pass ID.
        # Repository handles None as "All".
        
        records = self.repository.list(target_empresa_id, limit, offset)
        return [ReporteGeneradoRead(**r) for r in records]

    def get_by_id(self, id: UUID, current_user: dict) -> ReporteGeneradoRead:
        record = self.repository.get_by_id(id)
        if not record:
            raise HTTPException(status_code=404, detail="Reporte not found")
            
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        user_empresa_id = current_user.get('empresa_id')
        
        if not is_superadmin:
            if str(record['empresa_id']) != str(user_empresa_id):
                 raise HTTPException(status_code=403, detail="Access denied")
        
        return ReporteGeneradoRead(**record)

    def delete(self, id: UUID, current_user: dict):
        # Only Superadmin or User who created it? 
        # Requirement: "Superadmin puede hacer todo el crud. pero para el usuario, depende de los permisos"
        # Usually users can delete their own reports or need explicit delete permission.
        # Enums has 'REPORTE_VER', 'REPORTE_EXPORTAR'. No 'REPORTE_ELIMINAR'.
        # So only Superadmin can delete, OR we implicitly allow owner to delete?
        # I'll restrict to Superadmin mostly, unless I find another perm.
        
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        if not is_superadmin:
             raise HTTPException(status_code=403, detail="Only Superadmin can delete reports")
             
        self.repository.delete(id)
