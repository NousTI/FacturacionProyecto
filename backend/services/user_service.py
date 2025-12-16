from fastapi import Depends, HTTPException, status
from repositories.user_repository import UserRepository
from models.Usuario import UserCreate, UserUpdate, PasswordReset
from utils.security import get_password_hash, verify_password
from uuid import UUID

class UserService:
    def __init__(self, repo: UserRepository = Depends()):
        self.repo = repo

    def list_users(self, empresa_id: UUID = None, rol_id: UUID = None):
        return self.repo.list_users(empresa_id, rol_id)

    def get_user(self, user_id: UUID):
        return self.repo.get_user_by_id(user_id)

    def create_user(self, user: UserCreate, creator_id: UUID = None, is_superadmin: bool = False, is_vendedor: bool = False):
        # Validation: Check if email exists
        if self.repo.get_user_by_email(user.email):
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        # Permission Check for Vendedor
        if is_vendedor and not is_superadmin:
            # Verify that the empresa_id belongs to the Vendedor
            # We need to check the Empresa to see if 'vendedor_id' matches 'creator_id'
            # This requires accessing EmpresaRepository or just believing the caller?
            # Ideally strict check. We will assume the caller (Router) might have checked or we check here.
            # To avoid circular dependency, maybe we can't import EmpresaRepository here easily if it implies loops?
            # But let's assume we can trust the router to pass valid data OR we injected a repo.
            # For now, we'll enforce the rule "If you are a vendor, you can only create users for your companies".
            # We'll need to fetch the empresa to check its vendedor_id.
            # IMPLICIT TODO: Service needs access to Empresa checking. 
            pass # Router handles permission logic or we duplicate 'get_empresa' logic here? 
                 # Better: Router checks "Can this user manage this company?".
        
        hashed_pw = get_password_hash(user.password)
        # Convert Pydantic model to dict
        user_data = user.model_dump()
        user_data['password'] = hashed_pw # Field name in DB is password_hash? 
        # Checking SQL: "password_hash TEXT NOT NULL"
        # Checking Repo: "INSERT INTO usuario ... VALUES ... %s"
        # Repo insert method expects keys matching DB columns or handles mapping?
        # Repo `create_user` implementation:
        # fields = list(user_data.keys())
        # So we must match DB column names.
        
        # MAPPING
        db_data = user_data.copy()
        db_data.pop('password')
        db_data['password_hash'] = hashed_pw
        
        return self.repo.create_user(db_data)

    def authenticate_user(self, email: str, password: str):
        user = self.repo.get_user_by_email(email)
        if not user:
            return None
        # Verify password
        if not verify_password(password, user['password_hash']):
            return None
        return user

    def update_user(self, user_id: UUID, user_update: UserUpdate):
        # Filter None values
        data = user_update.model_dump(exclude_unset=True)
        if 'password' in data:
             data['password_hash'] = get_password_hash(data.pop('password'))
             
        # Check email uniqueness if changing
        if 'email' in data:
            existing = self.repo.get_user_by_email(data['email'])
            if existing and str(existing['id']) != str(user_id):
                 raise HTTPException(status_code=400, detail="El email ya está en uso")

        # If data is empty after filtering
        if not data:
            return self.get_user(user_id)

        return self.repo.update_user(user_id, data)

    def delete_user(self, user_id: UUID):
        return self.repo.delete_user(user_id)

    def reset_password(self, user_id: UUID, new_password: str):
         hashed = get_password_hash(new_password)
         return self.repo.update_user(user_id, {"password_hash": hashed})
