from cryptography.fernet import Fernet
import os

# Ideally move this to settings/env
# For now generating one if not present, but in production must be persistent
SECRET_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher_suite = Fernet(SECRET_KEY.encode())

class SecurityUtils:
    @staticmethod
    def encrypt_text(text: str) -> str:
        if not text: return ""
        return cipher_suite.encrypt(text.encode()).decode()

    @staticmethod
    def decrypt_text(encrypted_text: str) -> str:
        if not encrypted_text: return ""
        try:
            return cipher_suite.decrypt(encrypted_text.encode()).decode()
        except:
            # Handle decryption failure
            return ""
