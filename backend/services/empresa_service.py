from fastapi import Depends, HTTPException, status
from repositories.empresa_repository import EmpresaRepository
from models.Empresa import EmpresaCreate, EmpresaUpdate
from uuid import UUID

class EmpresaService:
    def __init__(self, repository: EmpresaRepository = Depends()):
        self.repository = repository

    def create_empresa(self, empresa: EmpresaCreate, user_id: UUID = None, is_superadmin: bool = False):
        # Validate RUC uniqueness
        if self.repository.get_empresa_by_ruc(empresa.ruc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El RUC ya está registrado para otra empresa"
            )
        
        # If created by Vendedor (not superadmin), assign vendedor_id automatically
        # Assuming permissions are checked in layout, but logic here ensures consistency
        data = empresa.model_dump(exclude_unset=True)
        
        # If caller is not superadmin, force assignment to themselves
        if not is_superadmin:
            if not user_id:
                  # Should not happen given auth dependencies but safety check
                  raise HTTPException(status_code=400, detail="Vendedor ID requerido")
            data['vendedor_id'] = user_id
        # Else (Superadmin): allow whatever is in data['vendedor_id'] (UUID or None)

            
        try:
             new_empresa = self.repository.create_empresa(data)
        except Exception as e:
             error_str = str(e)
             if "vendedor_id" in error_str and "viol" in error_str:
                  raise HTTPException(status_code=400, detail="El Vendedor ID especificado no existe")
             raise HTTPException(status_code=500, detail=f"Error al crear la empresa: {error_str}")
             
        if not new_empresa:
             raise HTTPException(status_code=500, detail="Error al crear la empresa")
        return new_empresa

    def get_empresa(self, empresa_id: UUID, user_id: UUID = None, is_superadmin: bool = False):
        empresa = self.repository.get_empresa_by_id(empresa_id)
        if not empresa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada"
            )
        
        # Permission Check
        if not is_superadmin:
            # If not superadmin, must be the owner Vendedor
            # Note: stored UUIDs might be strings or UUID objects in dict, so we str() comparison
            if str(empresa.get('vendedor_id')) != str(user_id):
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para ver esta empresa"
                )
                
        return empresa

    def list_empresas(self, vendedor_id: UUID = None, empresa_id: UUID = None):
        """
        Listar empresas con filtros opcionales.
        La lógica de permisos (quién puede ver qué) debe manejarse en el controlador/ruta.
        """
        return self.repository.list_empresas(vendedor_id=vendedor_id, empresa_id=empresa_id)

    def update_empresa(self, empresa_id: UUID, empresa_update: EmpresaUpdate, user_id: UUID = None, is_superadmin: bool = False):
        # Check permissions first by fetching
        current = self.get_empresa(empresa_id, user_id, is_superadmin)
        
        # RUC check if changing
        if empresa_update.ruc and empresa_update.ruc != current['ruc']:
             if self.repository.get_empresa_by_ruc(empresa_update.ruc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El RUC ya está en uso"
                )
        
        # STRICT Check: Vendedores cannot change 'activo' status
        if not is_superadmin:
            # Check if active status is being modified
            if empresa_update.activo is not None and empresa_update.activo != current['activo']:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Solo el Superadmin puede cambiar el estado activo de una empresa"
                )

        try:
            updated = self.repository.update_empresa(empresa_id, empresa_update.model_dump(exclude_unset=True))
        except Exception as e:
            error_str = str(e)
            if "vendedor_id" in error_str and "viol" in error_str:
                  raise HTTPException(status_code=400, detail="El Vendedor ID especificado no existe")
            raise HTTPException(status_code=500, detail=f"Error al actualizar empresa: {error_str}")

        if not updated:
             raise HTTPException(status_code=500, detail="Error al actualizar empresa")
        return updated

    def delete_empresa(self, empresa_id: UUID, user_id: UUID = None, is_superadmin: bool = False):
        # Use get_empresa to verify existence and permissions implicitly
        self.get_empresa(empresa_id, user_id, is_superadmin)
        
        # Proceed to delete
        success = self.repository.delete_empresa(empresa_id)
        if not success:
            raise HTTPException(status_code=500, detail="Error al eliminar la empresa")
        return success
