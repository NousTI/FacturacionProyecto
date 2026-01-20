import uuid
import jwt
from datetime import datetime, timedelta, timezone
from ..config.env import env

ALGORITHM = "HS256"

def create_access_token(data: dict):
    """
    Genera un JWT con jti y expiración.
    """
    to_encode = data.copy()
    jti = to_encode.get("jti") or uuid.uuid4().hex
    expire = datetime.now(timezone.utc) + timedelta(minutes=env.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "jti": jti})

    token = jwt.encode(to_encode, env.SECRET_KEY, algorithm=ALGORITHM)
    return token, jti

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, env.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
