from fastapi import Depends, HTTPException
from repositories.proveedor_repository import ProveedorRepository
from models.Proveedor import ProveedorCreate, ProveedorUpdate
from uuid import UUID
from utils.enums import AuthKeys

class ProveedorService:
    def __init__(self, repo: ProveedorRepository = Depends()):
        self.repo = repo

    def listar_proveedores(self, current_user: dict):
        # Determine empresa_id
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        empresa_id = current_user.get("empresa_id")

        if is_superadmin and not empresa_id:
             # Superadmin might want to see all or specific: unrelated to this specific constraint, 
             # but usually they act within context. If no context, empty? 
             # For now assume they act within an enterprise context or we'd need a different API for global.
             # The Repo filters by empresa_id.
             return [] 

        if not empresa_id:
             raise HTTPException(status_code=400, detail="Usuario no asociado a una empresa")

        return self.repo.listar_proveedores(empresa_id)

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
        empresa_id = current_user.get("empresa_id")
        if not empresa_id:
             raise HTTPException(status_code=400, detail="Usuario no asociado a una empresa")

        # RUC validation
        if len(datos.ruc) != 13:
            return {"error": "RUC debe tener 13 dígitos"}
        
        # Check uniqueness within empresa
        if self.repo.ruc_existe(datos.ruc, empresa_id):
             return {"error": "Ya existe un proveedor con este RUC en la empresa"}

        # Inject empresa_id
        datos_dict = datos.model_dump()
        datos_dict["empresa_id"] = empresa_id
        
        return self.repo.crear_proveedor(datos_dict)

    def actualizar_proveedor(self, proveedor_id: UUID, datos: ProveedorUpdate, current_user: dict):
        existing = self.obtener_proveedor(proveedor_id, current_user)
        if not existing:
             return None # or raise 404

        if datos.ruc and len(datos.ruc) != 13:
            return {"error": "RUC debe tener 13 dígitos"}
            
        # If RUC is changing, check uniqueness
        if datos.ruc and datos.ruc != existing['ruc']:
             empresa_id = current_user.get("empresa_id")
             if self.repo.ruc_existe(datos.ruc, empresa_id):
                  return {"error": "Ya existe un proveedor con este RUC"}

        return self.repo.actualizar_proveedor(proveedor_id, datos.model_dump(exclude_unset=True))

    def eliminar_proveedor(self, proveedor_id: UUID, current_user: dict):
        # Verify existence and access
        self.obtener_proveedor(proveedor_id, current_user) 
        
        return self.repo.eliminar_proveedor(proveedor_id)
