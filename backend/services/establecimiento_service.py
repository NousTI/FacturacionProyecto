from uuid import UUID
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from models.Establecimiento import EstablecimientoCreateInput, EstablecimientoCreate, EstablecimientoUpdate, EstablecimientoRead
from repositories.establecimiento_repository import EstablecimientoRepository
from utils.enums import AuthKeys

class EstablecimientoService:
    def __init__(self, repository: EstablecimientoRepository = Depends()):
        self.repository = repository

    def create(self, data: EstablecimientoCreateInput, current_user: dict) -> EstablecimientoRead:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        
        # Determine Empresa ID
        if is_superadmin:
            if not data.empresa_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Superadmin debe especificar 'empresa_id'"
                )
            target_empresa_id = data.empresa_id
        else:
            # Regular user must use their own empresa_id
            user_empresa_id = UUID(current_user["empresa_id"])
            if data.empresa_id and str(data.empresa_id) != str(user_empresa_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="No puede crear establecimientos para otra empresa"
                )
            target_empresa_id = user_empresa_id

        # Prepare Internal Data
        # We manually map Input to Create model to satisfy repository signature
        internal_data = EstablecimientoCreate(
            codigo=data.codigo,
            nombre=data.nombre,
            direccion=data.direccion,
            activo=data.activo
        )

        try:
            result = self.repository.create(internal_data, target_empresa_id)
            if not result:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear el establecimiento")
            return EstablecimientoRead(**result)
        except Exception as e:
            error_msg = str(e)
            if "uq_establecimiento_empresa_codigo" in error_msg:
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ya existe un establecimiento con el código '{data.codigo}' en esta empresa.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    def get_by_id(self, id: UUID, current_user: dict) -> EstablecimientoRead:
        result = self.repository.get_by_id(id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Establecimiento no encontrado")
        
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            user_empresa_id = UUID(current_user["empresa_id"])
            if str(result['empresa_id']) != str(user_empresa_id):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para acceder a este recurso")
            
        return EstablecimientoRead(**result)

    def list(self, current_user: dict, empresa_id: Optional[UUID] = None, limit: int = 100, offset: int = 0) -> List[EstablecimientoRead]:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        
        target_empresa_id = None
        
        if is_superadmin:
             if empresa_id:
                 target_empresa_id = empresa_id
        else:
             target_empresa_id = UUID(current_user["empresa_id"])

        results = self.repository.list(target_empresa_id, limit, offset)
        return [EstablecimientoRead(**row) for row in results]

    def update(self, id: UUID, data: EstablecimientoUpdate, current_user: dict) -> EstablecimientoRead:
        self.get_by_id(id, current_user) # Permissions check
        
        try:
            result = self.repository.update(id, data)
            if not result:
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al actualizar el registro")
            return EstablecimientoRead(**result)
        except Exception as e:
            error_msg = str(e)
            if "uq_establecimiento_empresa_codigo" in error_msg:
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ya existe un establecimiento con el código '{data.codigo}' en esta empresa.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    def delete(self, id: UUID, current_user: dict):
        self.get_by_id(id, current_user) # Permissions check
        
        success = self.repository.delete(id)
        if not success:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al eliminar el registro")
        return {"message": "Establecimiento eliminado correctamente"}
