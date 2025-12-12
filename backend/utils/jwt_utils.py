# backend/utils/jwt_utils.py

import uuid
import jwt
from datetime import datetime, timedelta, timezone

from settings import get_settings

ALGORITHM = "HS256"
_settings = get_settings()
SECRET_KEY = _settings.secret_key
ACCESS_TOKEN_EXPIRE_MINUTES = _settings.access_token_expire_minutes

def create_access_token(data: dict):
    """
    Genera un JWT con jti y expiración.
    Si el diccionario ya trae un jti, se respeta; de lo contrario se genera uno nuevo.
    """
    to_encode = data.copy()
    jti = to_encode.get("jti") or uuid.uuid4().hex
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "jti": jti})

    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token, jti


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
