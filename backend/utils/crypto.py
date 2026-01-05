import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException

class CryptoService:
    """
    Servicio de criptografía para manejo de información sensible (SRI).
    Utiliza AES-256-GCM como requerido.
    """
    def __init__(self, master_key: str):
        if not master_key:
            raise ValueError("CERT_MASTER_KEY no está definida")
        
        # Ensure key is valid (32 bytes / 256 bits). 
        # User might provide hex or base64. Let's assume user provided RAW string and we hash it? 
        # OR user provided 32-byte compatible string. 
        # Requirement: "CERT_MASTER_KEY=clave_maestra_larga_segura"
        # Best practice: Decode if hex/b64 or allow arbitrary implementation.
        # Implementation decision: SHA-256 hash the master key to ensure exactly 32 bytes provided.
        # This allows variable length passphrases in env while satisfying AES requirements.
        import hashlib
        self.key = hashlib.sha256(master_key.encode()).digest()
        self.aesgcm = AESGCM(self.key)

    def encrypt(self, data: bytes | str) -> bytes:
        """
        Cifra datos (bytes o str) usando AES-256-GCM.
        Genera un IV aleatorio (12 bytes) y lo adjunta al inicio.
        """
        if isinstance(data, str):
            data = data.encode()
            
        iv = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(iv, data, None)
        return iv + ciphertext

    def decrypt(self, data: bytes) -> bytes:
        """
        Descifra datos previamente cifrados por este servicio.
        Extrae el IV del inicio (primeros 12 bytes).
        """
        if len(data) < 12:
            raise ValueError("Datos corruptos o inválidos (muy cortos)")
            
        iv = data[:12]
        ciphertext = data[12:]
        
        try:
            plaintext = self.aesgcm.decrypt(iv, ciphertext, None)
            return plaintext
        except Exception as e:
            # Avoid exposing detail, but log if needed
            raise ValueError("Falló el descifrado: Clave incorrecta o datos corruptos") from e

    def decrypt_to_str(self, data: bytes) -> str:
        return self.decrypt(data).decode()
