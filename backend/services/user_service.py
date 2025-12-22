from fastapi import Depends, HTTPException, status
from repositories.user_repository import UserRepository
from services.empresa_service import EmpresaService
from models.Usuario import UserCreate, UserUpdate
from utils.security import get_password_hash, verify_password
from utils.enums import AuthKeys
from utils.messages import UserMessages
from uuid import UUID
from typing import List, Optional
from uuid import uuid4
from services.user_session_service import start_user_session
from utils.jwt_utils import create_access_token
from utils.responses import error_response

class UserService:
    def __init__(self, repo: UserRepository = Depends(), empresa_service: EmpresaService = Depends()):
        self.repo = repo
        self.empresa_service = empresa_service

    def _get_user_context(self, current_user: dict):
        return {
            "is_superadmin": current_user.get(AuthKeys.IS_SUPERADMIN, False),
            "is_vendedor": current_user.get(AuthKeys.IS_VENDEDOR, False),
            "is_usuario": current_user.get(AuthKeys.IS_USUARIO, False),
            "user_id": current_user.get("id"),
            "empresa_id": current_user.get("empresa_id")
        }

    def _sanitize(self, user: dict) -> dict:
        if not user: return None
        # Create a copy to avoid mutating the original reference if used elsewhere
        safe_user = user.copy()
        if "password_hash" in safe_user:
            del safe_user["password_hash"]
        return safe_user

    def list_users(self, current_user: dict, empresa_id: Optional[UUID] = None) -> List[dict]:
        ctx = self._get_user_context(current_user)
        
        users = []
        if ctx["is_superadmin"]:
             # Return all or filtered by empresa_id if provided
             users = self.repo.list_users(empresa_id=empresa_id)

        elif ctx["is_vendedor"]:
             # If empresa_id provided, check ownership of that empresa
             if empresa_id:
                 self.empresa_service.get_empresa(empresa_id, current_user) # Throws if no access
                 users = self.repo.list_users(empresa_id=empresa_id)
             else:
                 # Fetch all companies for this vendor and list users for all
                 empresas = self.empresa_service.list_empresas(current_user, vendedor_id=ctx["user_id"])
                 all_users = []
                 for emp in empresas:
                     all_users.extend(self.repo.list_users(empresa_id=emp['id']))
                 users = all_users

        elif ctx["is_usuario"]:
            # Can only list users of their own company
            if not ctx["empresa_id"]:
                 return []
            users = self.repo.list_users(empresa_id=ctx["empresa_id"])

        else:
            raise HTTPException(status_code=403, detail="No tienes permisos para listar usuarios")
            
        return [self._sanitize(u) for u in users]

    def get_user(self, user_id: UUID, current_user: dict):
        target_user = self.repo.get_user_by_id(user_id)
        if not target_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        ctx = self._get_user_context(current_user)

        # 1. Superadmin can see all
        if ctx["is_superadmin"]:
            return self._sanitize(target_user)
        
        # 2. User can see themselves
        if str(ctx["user_id"]) == str(user_id):
            return self._sanitize(target_user)

        # 3. Vendedor can see users of their companies
        if ctx["is_vendedor"]:
             # Check if target user's company belongs to this vendedor
             empresa_id = target_user['empresa_id']
             self.empresa_service.get_empresa(empresa_id, current_user) # Throws if no access
             return self._sanitize(target_user)

        # 4. User can see other users in SAME company
        if ctx["is_usuario"]:
             if str(target_user.get('empresa_id')) == str(ctx["empresa_id"]):
                  return self._sanitize(target_user)

        raise HTTPException(status_code=403, detail="No tienes permiso para ver este usuario")

    def create_user(self, user: UserCreate, current_user: dict):
        ctx = self._get_user_context(current_user)
        
        # Validation: Check if email exists
        if self.repo.get_user_by_email(user.email):
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        # Permission / Access Control
        if ctx["is_usuario"]:
            # Check if they are defining the correct company
            if str(user.empresa_id) != str(ctx["empresa_id"]):
                 raise HTTPException(status_code=403, detail=UserMessages.COMPANY_MISMATCH)

        if ctx["is_vendedor"]:
             # Verify ownership of the target company
             self.empresa_service.get_empresa(user.empresa_id, current_user)

        # Superadmin can create anywhere
        
        hashed_pw = get_password_hash(user.password)
        user_data = user.model_dump()
        
        # MAPPING
        db_data = user_data.copy()
        db_data.pop('password')
        db_data['password_hash'] = hashed_pw
        
        return self._sanitize(self.repo.create_user(db_data))

    def authenticate_user(self, email: str, password: str):
        # Allow internal call without current_user context for login
        user = self.repo.get_user_by_email(email)
        if not user:
            return None
        # Verify password
        if not verify_password(password, user['password_hash']):
            return None
        return user

    def login_user(self, credentials: dict, user_agent: str = None, ip_address: str = None):
        email = credentials.get("email")
        password = credentials.get("password")
        
        user = self.authenticate_user(email, password)
        if not user:
             raise HTTPException(
                status_code=401,
                detail=error_response(401, "Credenciales incorrectas"),
            )
            
        user_id = user["id"]
        session_id = uuid4().hex
        
        # Access repo's db connection
        conn = self.repo.db
        
        # Start session
        session_id = start_user_session(
            conn,
            user_id=user_id,
            jti=session_id,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        
        if session_id is None:
            raise HTTPException(
                status_code=403,
                detail=error_response(
                    403, "Ya existe una sesión activa. Cierra sesión antes de iniciar una nueva."
                ),
            )
            
        token, _ = create_access_token(
            {
                "sub": str(user_id),
                "sid": session_id,
                "jti": session_id,
            }
        )
        
        return {"access_token": token, "token_type": "bearer"}

    def update_user(self, user_id: UUID, user_update: UserUpdate, current_user: dict):
        # Access control
        # Logic: Can update if I can GET the user? 
        # Usually: Admin/Vendedor/User restrictions.
        # User restricted to self? "Regular users cannot update themselves (except password via reset)" -> Route comment.
        # But actually typically users can update profile. Assumption: Users MIGHT update profile. 
        # But requirements in route said: "if is_usuario: check target is same company".
        # Let's enforce: Superadmin (Yes), Vendedor (Yes if owned), User (Only Self or Company Admin?)
        # For simplicity based on route logic: User can update users in same company? Or just themselves?
        # Route logic line 125: "Regular users cannot update themselves... Actually Admins CAN"
        # Let's rely on `get_user` check first (visibility), then specific write check.
        
        target_user = self.get_user(user_id, current_user) # Ensure visibility
        ctx = self._get_user_context(current_user)

        # Filter None values
        data = user_update.model_dump(exclude_unset=True)
        if 'password' in data:
             data['password_hash'] = get_password_hash(data.pop('password'))
             
        # Check email uniqueness if changing
        if 'email' in data:
            existing = self.repo.get_user_by_email(data['email'])
            if existing and str(existing['id']) != str(user_id):
                 raise HTTPException(status_code=400, detail="El email ya está en uso")
                 
        if ctx["is_vendedor"]:
             # If updating company, check ownership of new company
             if 'empresa_id' in data:
                  self.empresa_service.get_empresa(data['empresa_id'], current_user) # Throws if no access

        # If data is empty after filtering
        if not data:
            return self._sanitize(target_user)

        return self._sanitize(self.repo.update_user(user_id, data))

    def delete_user(self, user_id: UUID, current_user: dict):
        target_user = self.get_user(user_id, current_user) # Ensure visibility
        ctx = self._get_user_context(current_user)
        
        if ctx["is_usuario"]:
             # Users usually cannot delete other users. Maybe Company Admin?
             # Assuming standard User shouldn't delete.
             raise HTTPException(status_code=403, detail="No tienes permisos para eliminar usuarios")

        return self.repo.delete_user(user_id)

    def reset_password(self, user_id: UUID, new_password: str):
         # This is likely internal or specific flow.
         hashed = get_password_hash(new_password)
         return self.repo.update_user(user_id, {"password_hash": hashed})
