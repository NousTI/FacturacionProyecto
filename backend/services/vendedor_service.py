from fastapi import Depends, HTTPException, status
from repositories.vendedor_repository import VendedorRepository
from models.Vendedor import VendedorCreate, VendedorUpdate
from utils.security import get_password_hash
from uuid import UUID

class VendedorService:
    def __init__(self, repository: VendedorRepository = Depends()):
        self.repository = repository

    def create_vendedor(self, vendedor: VendedorCreate):
        if self.repository.get_by_email(vendedor.email):
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado para otro vendedor"
            )
        
        hashed_password = get_password_hash(vendedor.password)
        new_vendedor = self.repository.create(vendedor, hashed_password)
        if not new_vendedor:
            raise HTTPException(status_code=500, detail="Error al crear el vendedor")
        return new_vendedor

    def get_vendedor(self, vendedor_id: UUID):
        vendedor = self.repository.get_by_id(vendedor_id)
        if not vendedor:
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendedor no encontrado"
            )
        return vendedor

    def get_all_vendedores(self):
        return self.repository.get_all()

    def update_vendedor(self, vendedor_id: UUID, vendedor_update: VendedorUpdate):
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
        return updated

    def delete_vendedor(self, vendedor_id: UUID):
        if not self.repository.get_by_id(vendedor_id):
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendedor no encontrado"
            )
        return self.repository.delete(vendedor_id)
