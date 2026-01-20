from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class EnvSettings(BaseSettings):
    """
    Variables de entorno validadas con Pydantic.
    """
    # Base de Datos
    DB_HOST: str = "localhost"
    DB_NAME: str = "sistema_facturacion"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "password"
    DB_PORT: int = 5432

    # Seguridad / JWT
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # SRI Seguridad
    CERT_MASTER_KEY: str
    CERT_CIPHER_ALGORITHM: str = "AES-256-GCM"

    # Configuración General
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "../../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

# Instancia global
env = EnvSettings()
