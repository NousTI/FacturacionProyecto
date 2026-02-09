from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography import x509
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

    def _decode_value(self, value):
        """Intenta decodificar un valor ASN.1 de forma segura"""
        if not isinstance(value, bytes):
            return str(value)
        
        # Si el valor ya parece ser texto plano (no ASN.1 tag al inicio)
        if len(value) > 0 and value[0] not in [0x0C, 0x13, 0x16, 0x1E]:
            try:
                return value.decode('utf-8')
            except:
                pass

        # Patrón común ASN.1: Tag (1 byte) + Longitud + Contenido
        if len(value) > 2:
            tag = value[0]
            # Tags comunes: 0x0C (UTF8String), 0x13 (PrintableString), 0x16 (IA5String)
            if tag in [0x0C, 0x13, 0x16]:
                try:
                    length = value[1]
                    if length < 128:
                        return value[2:2+length].decode('utf-8', errors='ignore')
                    else:
                        # Formato largo de longitud
                        num_ext_bytes = length & 0x7F
                        # El contenido empieza después del tag y los bytes de longitud
                        return value[2+num_ext_bytes:].decode('utf-8', errors='ignore')
                except:
                    pass
            # 0x1E es BMPString (UTF-16BE)
            elif tag == 0x1E:
                try:
                    return value[2:].decode('utf-16-be', errors='ignore')
                except:
                    pass
        
        # Último recurso: intentar decodificar todo como utf-8
        try:
            return value.decode('utf-8', errors='ignore')
        except:
            return str(value)

    def extraer_datos_sri(self) -> Dict[str, str]:
        """Extrae datos específicos del SRI detectando el emisor (BCE, SD, Judicatura, ANF)"""
        datos_sri = {}
        cert = self._cargar()

        # Mapa maestro de OIDs por Agencia
        oid_map = {
            # UAN / Consejo de la Judicatura (Antiguos/Estandarizado)
            "1.3.6.1.4.1.59382.3.1": "RUC/Cédula",
            "1.3.6.1.4.1.59382.3.2": "Nombres",
            "1.3.6.1.4.1.59382.3.6": "Razón Social",
            "1.3.6.1.4.1.59382.3.11": "RUC Empresa",
            
            # Banco Central del Ecuador (BCE / ECIBCE)
            "1.3.6.1.4.1.37253.1.1": "RUC",
            "1.3.6.1.4.1.37253.1.2": "Cédula",
            "1.3.6.1.4.1.37253.1.10": "RUC Empresa",

            # Security Data
            "1.3.6.1.4.1.37442.3.11": "RUC",
            "1.3.6.1.4.1.37442.3.1": "Cédula",
            "1.3.6.1.4.1.37442.3.10": "Razón Social",
            "1.3.6.1.4.1.37442.3.12": "RUC Empresa",

            # ANF
            "1.3.6.1.4.1.18332.3.1.1.1.2": "RUC",
            "1.3.6.1.4.1.18332.3.1.1.1.1": "Cédula"
        }
        
        try:
            # Buscar en Subject Alternative Name (SAN)
            san_ext = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)
            for gn in san_ext.value:
                if isinstance(gn, x509.OtherName):
                    oid_str = str(gn.type_id)
                    for oid_key, oid_label in oid_map.items():
                        if oid_key in oid_str:
                            valor = self._decode_value(gn.value)
                            if valor:
                                datos_sri[oid_label] = valor
                            break
        except Exception:
            pass
        
        return datos_sri

    def extraer_metadatos(self) -> Dict[str, Any]:
        """Extrae la información necesaria para el sistema de facturación"""
        cert = self._cargar()
        datos_sri = self.extraer_datos_sri()
        
        # Estrategia para determinar RUC
        ruc = ""
        
        # 1. Prioridad: RUC explícito en extensiones
        if "RUC" in datos_sri:
            ruc = datos_sri["RUC"]
        elif "RUC Empresa" in datos_sri:
            ruc = datos_sri["RUC Empresa"]
        elif "RUC/Cédula" in datos_sri and len(datos_sri["RUC/Cédula"]) == 13:
            ruc = datos_sri["RUC/Cédula"]
            
        # 2. Fallback: Buscar en el Subject (DN)
        # Algunos certificados antiguos o de prueba ponen el RUC en serialNumber o commonName
        if not ruc:
            for attr in cert.subject:
                # serialNumber (2.5.4.5)
                if attr.oid.dotted_string == "2.5.4.5":
                     val = attr.value
                     if len(val) == 13 and val.isdigit():
                         ruc = val
                         break
                # commonName (2.5.4.3) - A veces contiene el RUC
                if attr.oid.dotted_string == "2.5.4.3":
                    # Heurística simple: buscar secuencia de 13 dígitos
                    import re
                    match = re.search(r'\b\d{13}\b', attr.value)
                    if match:
                        ruc = match.group(0)

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
        if not emisor:
             for attr in cert.issuer:
                if attr.oid._name == "organizationName":
                    emisor = attr.value
                    break

        return {
            "fecha_activacion": cert.not_valid_before_utc,
            "fecha_expiracion": cert.not_valid_after_utc,
            "serial": str(cert.serial_number),
            "sujeto": sujeto,
            "emisor": emisor,
            "ruc": ruc  # RUC corregido
        }
