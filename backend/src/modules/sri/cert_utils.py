from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import pkcs12
from datetime import datetime
from typing import Dict, Any

class ExtractorCertificadoSRI:
    """Utilidad para extraer metadatos de un certificado .p12 para el SRI"""
    
    def __init__(self, p12_data: bytes, password: str):
        self.p12_data = p12_data
        self.password = password.encode() if isinstance(password, str) else password
        self.certificado = None
        
    def _cargar(self):
        if not self.certificado:
            privada, certificado, adicionales = pkcs12.load_key_and_certificates(
                self.p12_data, 
                self.password,
                backend=default_backend()
            )
            self.certificado = certificado
        return self.certificado

    def extraer_metadatos(self) -> Dict[str, Any]:
        """Extrae la información necesaria para el sistema de facturación"""
        cert = self._cargar()
        
        # Extraer Sujeto (CN)
        sujeto = ""
        for attr in cert.subject:
            if attr.oid._name == "commonName":
                sujeto = attr.value
                break
        
        # Extraer Emisor
        emisor = ""
        for attr in cert.issuer:
            if attr.oid._name == "commonName":
                emisor = attr.value
                break
        if not emisor: # Fallback a O
             for attr in cert.issuer:
                if attr.oid._name == "organizationName":
                    emisor = attr.value
                    break

        return {
            "fecha_activacion": cert.not_valid_before_utc,
            "fecha_expiracion": cert.not_valid_after_utc,
            "serial": str(cert.serial_number),
            "sujeto": sujeto,
            "emisor": emisor
        }
