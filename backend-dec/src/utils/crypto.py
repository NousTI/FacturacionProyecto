import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import hashlib

class CryptoService:
    def __init__(self, master_key: str):
        if not master_key:
            raise ValueError("CERT_MASTER_KEY no está definida")
        
        self.key = hashlib.sha256(master_key.encode()).digest()
        self.aesgcm = AESGCM(self.key)

    def encrypt(self, data: bytes | str) -> bytes:
        if isinstance(data, str):
            data = data.encode()
            
        iv = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(iv, data, None)
        return iv + ciphertext

    def decrypt(self, data: bytes) -> bytes:
        if len(data) < 12:
            raise ValueError("Datos corruptos o inválidos")
            
        iv = data[:12]
        ciphertext = data[12:]
        
        try:
            return self.aesgcm.decrypt(iv, ciphertext, None)
        except Exception as e:
            raise ValueError("Falló el descifrado: Clave incorrecta o datos corruptos") from e

    def decrypt_to_str(self, data: bytes) -> str:
        return self.decrypt(data).decode()
