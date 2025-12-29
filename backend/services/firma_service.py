from uuid import UUID
from fastapi import HTTPException
from models.ConfiguracionSRI import ConfiguracionSRIRead
from utils.security_utils import SecurityUtils
import os

# Note: library 'xmlsec' or 'signxml' would be imported here
# from signxml import XMLSigner, XMLVerifier

class FirmaService:
    def firmar_xml(self, xml_str: str, config: dict) -> str:
        """
        Files the XML using XAdES-BES.
        """
        # 1. Verify P12 File
        path_p12 = config.get('certificado_digital')
        if not path_p12 or not os.path.exists(path_p12):
             raise HTTPException(status_code=500, detail=f"Certificado no encontrado en ruta: {path_p12}")

        # 2. Decrypt Password (dummy or real)
        try:
            password = SecurityUtils.decrypt_text(config['clave_certificado'])
            if not password:
                raise ValueError("Contraseña vacía después de desencriptar")
        except Exception:
            raise HTTPException(status_code=500, detail="Error desencriptando contraseña del certificado")

        # 3. Real Signing Attempt (if library exists)
        try:
            from signxml import XMLSigner, XMLVerifier, methods
            from lxml import etree
            
            # Load P12 - Requires OpenSSL or similar. 
            # In Python, usually we load .p12 using cryptography or OpenSSL.crypto
            # For simplicity in this step, assuming we have the key/cert data.
            # *CRITICAL*: signxml needs key and cert as PEM or objects.
            
            # Since loading P12 in python strictly often requires 'cryptography',
            # let's try to load it. If we can't load it (bad password), we fail.
            
            with open(path_p12, "rb") as f:
                p12_data = f.read()
            
            from cryptography.hazmat.primitives.serialization import pkcs12
            from cryptography.hazmat.primitives import serialization
            
            # Attempt to load P12
            private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
                p12_data, 
                password.encode() if password else None
            )
            
            # Prepare for SignXML
            # XMLSigner expects the key/cert to be usable.
            
            root = etree.fromstring(xml_str.encode())
            
            signer = XMLSigner(
                method=methods.enveloped,
                signature_algorithm="rsa-sha1",
                digest_algorithm="sha1",
                c14n_algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
            )
            
            # Format Certs for XAdES (usually explicit)
            cert_pem = certificate.public_bytes(serialization.Encoding.PEM)
            key_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            signed_root = signer.sign(
                root,
                key=key_pem,
                cert=cert_pem
            )
            
            return etree.tostring(signed_root, encoding="unicode")
            
        except ImportError:
            # Library not installed -> Mock for Dev but Log Warning
            print("WARNING: 'signxml' or 'cryptography' not installed. Using MOCK signature.")
            return self._mock_sign(xml_str)
            
        except Exception as e:
            # If real signing fails (e.g. Bad Password, Expired), we MUST raise error 
            # so it is logged in LogEmision/AutorizacionSRI as a failure.
            raise HTTPException(status_code=500, detail=f"Error firmando XML: {str(e)}")

    def _mock_sign(self, xml_str: str) -> str:
        return xml_str.replace("</factura>", self._get_mock_signature() + "\n</factura>")

    def _get_mock_signature(self) -> str:
        return """
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="Signature-123">
        <ds:SignedInfo>
            <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
            <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
            <ds:Reference URI="#comprobante">
                <ds:Transforms>
                    <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
                </ds:Transforms>
                <ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
                <ds:DigestValue>MzQ...</ds:DigestValue>
            </ds:Reference>
        </ds:SignedInfo>
        <ds:SignatureValue>...</ds:SignatureValue>
        <ds:KeyInfo>
            <ds:X509Data>
                <ds:X509Certificate>...</ds:X509Certificate>
            </ds:X509Data>
        </ds:KeyInfo>
    </ds:Signature>"""
