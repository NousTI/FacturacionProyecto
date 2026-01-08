# backend/settings.py
from functools import lru_cache
from typing import List
import os
from dotenv import load_dotenv

load_dotenv(override=True)




def _split_origins(raw: str) -> List[str]:
    return [o.strip() for o in raw.split(",") if o.strip()]


class Settings:
    """
    Configuración centralizada basada en variables de entorno.
    No depende de pydantic-settings para evitar import errors.
    """

    def __init__(self):
        # DB
        self.db_host: str = os.getenv("DB_HOST", "localhost")
        self.db_name: str = os.getenv("DB_NAME", "sistema_facturacion")
        self.db_user: str = os.getenv("DB_USER", "postgres")
        self.db_password: str = os.getenv("DB_PASSWORD", "password")
        self.db_port: int = int(os.getenv("DB_PORT", "5432"))

        # JWT
        self.secret_key: str = os.getenv("SECRET_KEY", "cambia-este-valor")
        self.access_token_expire_minutes: int = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        )

        # CORS
        default_origins = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4200,http://127.0.0.1:4200"
        self.allowed_origins: List[str] = _split_origins(
            os.getenv("ALLOWED_ORIGINS", default_origins)
        )
        
        # SRI Security
        self.cert_master_key: str = os.getenv("CERT_MASTER_KEY")
        self.cert_cipher_algorithm: str = os.getenv("CERT_CIPHER_ALGORITHM", "AES-256-GCM")

        if not self.cert_master_key:
             # Fail fast as required by user
             raise ValueError("CRITICAL: CERT_MASTER_KEY is missing from environment variables.")


@lru_cache
def get_settings() -> Settings:
    return Settings()
