from fastapi import Depends, HTTPException
from typing import List, Optional
from repositories.proveedor_repository import ProveedorRepository
from models.Proveedor import ProveedorCreate, ProveedorUpdate
from uuid import UUID
from utils.enums import AuthKeys

class ProveedorService:
    def __init__(self, repo: ProveedorRepository = Depends()):
        self.repo = repo

    def listar_proveedores(self, current_user: dict, empresa_id: Optional[UUID] = None):
        # Determine empresa_id
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        user_empresa_id = current_user.get("empresa_id")

        if is_superadmin:
             # If param is None, list all (pass None to repo)
             # If param is set, filter by it
             target_empresa_id = empresa_id 
        else:
             # Regular user must use their own
             if empresa_id and str(empresa_id) != str(user_empresa_id):
                   raise HTTPException(status_code=400, detail="No puedes listar proveedores de otra empresa")
             target_empresa_id = user_empresa_id

        if not is_superadmin and not target_empresa_id:
             raise HTTPException(status_code=400, detail="Usuario no asociado a una empresa")

        return self.repo.listar_proveedores(target_empresa_id)

    def obtener_proveedor(self, proveedor_id: UUID, current_user: dict):
        proveedor = self.repo.obtener_proveedor_por_id(proveedor_id)
        if not proveedor:
            return None
        
        # Verify ownership
        user_empresa_id = current_user.get("empresa_id")
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)

        if not is_superadmin and str(proveedor['empresa_id']) != str(user_empresa_id):
             raise HTTPException(status_code=403, detail="No tienes acceso a este proveedor")

        return proveedor

    def crear_proveedor(self, datos: ProveedorCreate, current_user: dict):
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        
        if is_superadmin:
            if not datos.empresa_id:
                raise HTTPException(status_code=400, detail="Superadmins deben especificar empresa_id")
            empresa_id = datos.empresa_id
        else:
            if datos.empresa_id:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="No tienes permisos para asignar manualmente la empresa. Se asigna automáticamente."
                )
            empresa_id = current_user.get("empresa_id")
            if not empresa_id:
                 raise HTTPException(status_code=400, detail="Usuario no asociado a una empresa")
            # Auto-assign
            datos.empresa_id = empresa_id

        # Check uniqueness within empresa
        if self.repo.identificacion_existe(datos.identificacion, empresa_id):
             return {"error": "Ya existe un proveedor con esta identificación en la empresa"}

        # Inject empresa_id
        datos_dict = datos.model_dump()
        datos_dict["empresa_id"] = empresa_id
        
        return self.repo.crear_proveedor(datos_dict)

    def actualizar_proveedor(self, proveedor_id: UUID, datos: ProveedorUpdate, current_user: dict):
        existing = self.obtener_proveedor(proveedor_id, current_user)
        if not existing:
             return None # or raise 404
            
        # If Identificacion is changing, check uniqueness
        if datos.identificacion and datos.identificacion != existing['identificacion']:
             empresa_id = existing['empresa_id']
             if self.repo.identificacion_existe(datos.identificacion, empresa_id):
                  return {"error": "Ya existe un proveedor con esta identificación"}

        return self.repo.actualizar_proveedor(proveedor_id, datos.model_dump(exclude_unset=True))

    def eliminar_proveedor(self, proveedor_id: UUID, current_user: dict):
        # Verify existence and access
        self.obtener_proveedor(proveedor_id, current_user) 
        
        return self.repo.eliminar_proveedor(proveedor_id)
