from fastapi import Depends, HTTPException, status
from repositories.vendedor_repository import VendedorRepository
from models.Vendedor import VendedorCreate, VendedorUpdate
from utils.security import get_password_hash
from utils.enums import AuthKeys
from uuid import UUID

class VendedorService:
    def __init__(self, repository: VendedorRepository = Depends()):
        self.repository = repository

    def _check_superadmin(self, current_user: dict):
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Requiere permisos de Superadmin"
            )

    def _sanitize(self, vendedor: dict) -> dict:
        if not vendedor: return None
        safe_vendedor = vendedor.copy()
        if "password_hash" in safe_vendedor:
            del safe_vendedor["password_hash"]
        return safe_vendedor

    def get_profile(self, current_user: dict):
        if not current_user.get("is_vendedor"):
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No eres un vendedor"
            )
        # Delegate to get_vendedor with own ID
        return self.get_vendedor(current_user["id"], current_user)

    def create_vendedor(self, vendedor: VendedorCreate, current_user: dict):
        self._check_superadmin(current_user)

        if self.repository.get_by_email(vendedor.email):
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado para otro vendedor"
            )
        
        hashed_password = get_password_hash(vendedor.password)
        new_vendedor = self.repository.create(vendedor, hashed_password)
        if not new_vendedor:
            raise HTTPException(status_code=500, detail="Error al crear el vendedor")
        return self._sanitize(new_vendedor)

    def get_vendedor(self, vendedor_id: UUID, current_user: dict):
        # Check permissions: Superadmin OR the specific seller (self)
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        user_id = str(current_user.get("id"))
        
        if not is_superadmin and user_id != str(vendedor_id):
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver este vendedor"
            )

        vendedor = self.repository.get_by_id(vendedor_id)
        if not vendedor:
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendedor no encontrado"
            )
        return self._sanitize(vendedor)

    def get_all_vendedores(self, current_user: dict):
        self._check_superadmin(current_user)
        vendedores = self.repository.get_all()
        return [self._sanitize(v) for v in vendedores]

    def update_vendedor(self, vendedor_id: UUID, vendedor_update: VendedorUpdate, current_user: dict):
        # Permission check: Superadmin or Self
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
        user_id = str(current_user.get("id"))
        
        if not is_superadmin and user_id != str(vendedor_id):
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para editar este vendedor"
            )

        # Verify existence
        current = self.repository.get_by_id(vendedor_id)
        if not current:
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendedor no encontrado"
            )

        # Check unique email if changing
        if vendedor_update.email and vendedor_update.email != current['email']:
             if self.repository.get_by_email(vendedor_update.email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El email ya está en uso"
                )
        
        password_hash = None
        if vendedor_update.password:
            password_hash = get_password_hash(vendedor_update.password)

        updated = self.repository.update(vendedor_id, vendedor_update, password_hash)
        if not updated:
             raise HTTPException(status_code=500, detail="Error al actualizar vendedor")
        return self._sanitize(updated)

    def delete_vendedor(self, vendedor_id: UUID, current_user: dict):
        self._check_superadmin(current_user)
        
        if not self.repository.get_by_id(vendedor_id):
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendedor no encontrado"
            )
        return self.repository.delete(vendedor_id)
