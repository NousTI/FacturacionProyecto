from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from dependencies.auth_dependencies import get_current_user
from services.vendedor_service import VendedorService
from models.Vendedor import VendedorCreate, VendedorRead, VendedorUpdate

router = APIRouter()

@router.post("/", response_model=VendedorRead, status_code=status.HTTP_201_CREATED)
def create_vendedor(
    vendedor: VendedorCreate,
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    if not current_user.get("is_superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo superadmins pueden crear vendedores"
        )
    return service.create_vendedor(vendedor)

@router.get("/me", response_model=VendedorRead)
def get_current_vendedor_profile(
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    # Verify it is a Vendedor
    if not current_user.get("is_vendedor"):
        # Could be superadmin wanting to see their 'vendedor' profile? No, superadmin is superadmin.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No eres un vendedor"
        )
    return service.get_vendedor(current_user["id"])

@router.get("/", response_model=List[VendedorRead])
def get_all_vendedores(
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    if not current_user.get("is_superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo superadmins pueden listar todos los vendedores"
        )
    return service.get_all_vendedores()

@router.get("/{vendedor_id}", response_model=VendedorRead)
def get_vendedor(
    vendedor_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    # Check permissions: Superadmin OR the specific seller
    is_superadmin = current_user.get("is_superadmin")
    
    # We need to know if current_user is a seller and if the ID matches.
    # Current auth logic (auth_dependencies.py) returns a dict.
    # We might need to check if the user is indeed a seller.
    # Assuming standard user table check + is_superadmin flag.
    # Wait, the auth dependency checks `superadmin` table OR `usuario` table.
    # It does NOT check `vendedor` table currently.
    # This is a critical gap. The prompt implies Vendedor module implementation.
    # If Vendedores login, they need to be authenticated.
    # IF the user implies Vendedor is just a rol in `usuario` table, then it's different.
    # BUT `vendedor` is a separate table in schema (lines 27-45 of SQL).
    # So `auth_dependencies` needs to be updated to support Vendedor login?
    # OR we assume Vendedor login is not yet implemented and we just implement CRUD for superadmin now?
    # The prompt says: "el superadmin puede hacer el crud completo, y el vendedor solo puede editarse y listarse a si mimso"
    # This implies Vendedor CAN login.
    # However, I haven't been asked to implement Login for Vendedor, just the endpoints.
    # But to restrict "editarse a si mismo", I need `current_user` to reflect a Vendedor.
    
    # For now, I will implement the route logic assuming `current_user` MIGHT have an ID that matches `vendedor_id`.
    # But since `auth_dependencies` only checks `usuario` and `superadmin`, a logged-in `vendedor` 
    # wouldn't pass `get_current_user` if they are in `vendedor` table, unless `usuario` table is linked?
    # Looking at SQL: `empresa` has `vendedor_id`. `usuario` belongs to `empresa`.
    # `vendedor` table seems separate from `usuario` table.
    # Vendedor has `email` and `password_hash`. It IS a user type.
    
    # I will proceed with checks, but I might need to note that Auth needs update if it doesn't support Vendedor login yet.
    # For the purpose of this task (Endpoint creation), I will assume `current_user` has an `id`.
    
    user_id = str(current_user.get("id"))
    target_id = str(vendedor_id)
    
    if not is_superadmin and user_id != target_id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este vendedor"
        )

    return service.get_vendedor(vendedor_id)

@router.put("/{vendedor_id}", response_model=VendedorRead)
def update_vendedor(
    vendedor_id: UUID,
    vendedor_update: VendedorUpdate,
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    is_superadmin = current_user.get("is_superadmin")
    user_id = str(current_user.get("id"))
    target_id = str(vendedor_id)

    if not is_superadmin and user_id != target_id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para editar este vendedor"
        )
        
    return service.update_vendedor(vendedor_id, vendedor_update)

@router.delete("/{vendedor_id}", status_code=status.HTTP_200_OK)
def delete_vendedor(
    vendedor_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    if not current_user.get("is_superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo superadmins pueden eliminar vendedores"
        )
    service.delete_vendedor(vendedor_id)
    return {"message": "Vendedor eliminado exitosamente"}
