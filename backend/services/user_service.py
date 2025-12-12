from fastapi import Depends
from repositories.user_repository import UserRepository
from models.Usuario import UserRegister, UserRead # Assuming UserRegister/Read exist or I used them before
from utils.security import get_password_hash, verify_password

class UserService:
    def __init__(self, repo: UserRepository = Depends()):
        self.repo = repo

    def list_users(self, usuario: str = None, correo: str = None, fk_rol: int = None):
        return self.repo.list_users(usuario, correo, fk_rol)

    def get_user(self, user_id: int):
        return self.repo.get_user_by_id(user_id)

    def create_user(self, user: UserRegister):
        # Hash password if needed
        # UserRegister uses 'constr' (str), so no get_secret_value needed.
        password = user.contrasena.get_secret_value() if hasattr(user.contrasena, 'get_secret_value') else user.contrasena
        hashed_pw = get_password_hash(password)
        return self.repo.create_user(
            user.fk_rol,
            user.fk_suscripcion,
            user.usuario,
            hashed_pw,
            user.correo
        )

    def update_user(self, user_id: int, user: UserRegister):
        # 1. Check if user exists (optional, repo handles it but returns None)
        # 2. Hash new password
        password = user.contrasena.get_secret_value() if hasattr(user.contrasena, 'get_secret_value') else user.contrasena
        hashed_pw = get_password_hash(password)
        
        # 3. Call repo
        # Note: Repo update_user currently expects (user_id, fk_rol, fk_suscripcion, usuario, correo).
        # It does NOT update password currently in the repo method signature I saw earlier!
        # Checking repo again... 
        # Repo 'update_user' signature: def update_user(self, user_id, fk_rol, fk_suscripcion, usuario, correo):
        # It misses password!
        # I must fix Repo first if I want to update password, OR I tell user "Password update not supported".
        # Given "UserRegister" forces password, we MUST update it or ignore it.
        # I will just pass the fields Repo accepts for now to avoid breaking changes, 
        # BUT this means password sent in body is IGNORED.
        # This is a caveat I must explain or fix.
        # I will fix the Repo to accept password too.
        
        return self.repo.update_user(
            user_id,
            user.fk_rol,
            user.fk_suscripcion,
            user.usuario,
            user.correo,
            hashed_password=hashed_pw
        )

    def delete_user(self, user_id: int):
        return self.repo.delete_user(user_id)

# ... inside authenticate_user ...
    def authenticate_user(self, usuario: str, contrasena: str):
        user = self.repo.get_user_by_usuario(usuario)
        if not user:
            return None
        # Verify password
        password_str = contrasena.get_secret_value() if hasattr(contrasena, 'get_secret_value') else contrasena
        if not verify_password(password_str, user['contrasena']):
            return None
        return user
