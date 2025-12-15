from datetime import datetime, timezone
from fastapi import Depends
from database.connection import get_db_connection
from repositories.superadmin_session_repository import SuperadminSessionRepository

class SuperadminSessionService:
    def __init__(self, db=Depends(get_db_connection)):
        self.repo = SuperadminSessionRepository(db)

    def start_superadmin_session(self, superadmin_id, jti, user_agent=None, ip_address=None):
        # Check for active session
        active_session = self.repo.get_active_session_for_superadmin(superadmin_id)
        
        if active_session:
            expires_at = active_session["expires_at"]
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            # If active and not expired, return None (STRICT MODE)
            if expires_at > datetime.now(timezone.utc):
                return None
            
            # If expired, invalidate it and proceed
            self.repo.invalidate_session(active_session["id"])

        return self.repo.create_session(superadmin_id, jti, user_agent, ip_address)

    def validate_session(self, session_id: str):
        session = self.repo.get_session(session_id)
        if not session or not session["is_valid"]:
            return False
            
        expires_at = session["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            
        if expires_at < datetime.now(timezone.utc):
            self.repo.invalidate_session(session_id)
            return False
            
        return True

    def end_session(self, session_id: str):
        self.repo.invalidate_session(session_id)
        return True
