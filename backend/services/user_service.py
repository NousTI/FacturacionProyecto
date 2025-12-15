from fastapi import Depends
from repositories.user_repository import UserRepository
from models.Usuario import UserRegister, UserRead
from utils.security import get_password_hash, verify_password

class UserService:
    def __init__(self, repo: UserRepository = Depends()):
        self.repo = repo

    def list_users(self, usuario=None, correo=None, fk_rol=None):
        return self.repo.list_users(usuario, correo, fk_rol)

    def get_user(self, user_id):
        return self.repo.get_user_by_id(user_id)

    def create_user(self, user: UserRegister):
        hashed_pw = get_password_hash(user.contrasena)
        return self.repo.create_user(
            user.fk_suscripcion,
            user.fk_rol,
            user.correo,
            hashed_pw,
            user.usuario
        )

    def authenticate_user(self, correo: str, contrasena: str):
        user = self.repo.get_user_by_email(correo)
        if not user:
            return None
        # Verify password
        if not verify_password(contrasena, user['contrasena']):
            return None
        return user
