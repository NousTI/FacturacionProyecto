
import OpenSSL.crypto
import base64
import hashlib
from datetime import datetime
from uuid import uuid4
from lxml import etree
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.x509.oid import NameOID

class XMLSigner:
    """
    Implmentación Manual de Firma XAdES-BES para SRI (Ecuador).
    Evita limitaciones de librerías de alto nivel (signxml).
    """

    NAMESPACES = {
        'ds': 'http://www.w3.org/2000/09/xmldsig#',
        'etsi': 'http://uri.etsi.org/01903/v1.3.2#',
    }

    def __init__(self, p12_data: bytes, p12_password: str):
        self.p12_data = p12_data
        self.p12_password = p12_password
        self._key = None
        self._cert = None
        self._additional_certs = []
        self._load_credentials()

    def _load_credentials(self):
        try:
            password_bytes = self.p12_password.encode('utf-8') if self.p12_password else None
            p12 = pkcs12.load_key_and_certificates(self.p12_data, password_bytes)
            self._key = p12[0]
            self._cert = p12[1]
            self._additional_certs = p12[2] or []
            
            if not self._key or not self._cert:
               raise ValueError("El archivo .p12 no contiene clave privada o certificado.")
        except Exception as e:
            raise ValueError(f"Error al cargar credenciales .p12: {str(e)}")

    def check_validity(self):
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)
        if self._cert.not_valid_after_utc < now:
             raise ValueError("El certificado digital ha expirado.")
        
        # Debug Prints
        print(f"DEBUG CERT: NotBefore(UTC)={self._cert.not_valid_before_utc}")
        print(f"DEBUG CERT: NotAfter(UTC)={self._cert.not_valid_after_utc}")
        print(f"DEBUG SYS : Now(UTC)={now}")

    def sign_xml(self, xml_bytes: bytes) -> bytes:
        """
        Genera firma XAdES-BES manual incorporando:
        - Reference a #comprobante
        - Reference a #SignedProperties
        - KeyInfo con cadena de certificados
        - Object con QualifyingProperties (XAdES)
        """
        try:
            # 1. Preparar XML Base
            parser = etree.XMLParser(remove_blank_text=True)
            root = etree.fromstring(xml_bytes, parser=parser)
            
            # Asegurar que el root tiene el ID correcto si no lo tiene
            if 'id' not in root.attrib:
                root.attrib['id'] = 'comprobante'
            
            # IDs aleatorios para unicidad
            signature_id = f"Signature-{uuid4()}"
            signed_props_id = f"SignedProperties-{uuid4()}"
            signed_info_id = f"SignedInfo-{uuid4()}"
            reference_id = f"Reference-{uuid4()}"
            key_info_id = f"KeyInfo-{uuid4()}" # Optional
            
            # 2. Canonicalización y Hash del Documento (#comprobante)
            # SRI usa C14N sin comentarios usualmente
            # El documento es TODO el nodo raíz
            doc_c14n = etree.tostring(root, method="c14n", exclusive=False, with_comments=False)
            doc_digest = base64.b64encode(hashlib.sha1(doc_c14n).digest()).decode() # SRI suele usar SHA1 para digests
            
            # 3. Construir XAdES SignedProperties
            etsi = self.NAMESPACES['etsi']
            ds = self.NAMESPACES['ds']
            nsmap = {'ds': ds, 'etsi': etsi}
            
            # Preparar datos del certificado para XAdES
            cert_der = self._cert.public_bytes(encoding=serialization.Encoding.DER)
            cert_digest = hashlib.sha1(cert_der).digest()
            cert_digest_b64 = base64.b64encode(cert_digest).decode()
            serial_number = self._cert.serial_number
            
            # Issuer Name en formato correcto (RFC4514 inverso a veces, pero lxml maneja standard)
            # Intentamos usar el string normal. SRI valida contenido, no string exacto a veces.
            issuer_name = self._cert.issuer.rfc4514_string() 

            # Estructura SignedProperties
            qualifying_props = etree.Element(f"{{{etsi}}}QualifyingProperties", Target=f"#{signature_id}", nsmap=nsmap)
            signed_props = etree.SubElement(qualifying_props, f"{{{etsi}}}SignedProperties", Id=signed_props_id)
            
            signed_sig_props = etree.SubElement(signed_props, f"{{{etsi}}}SignedSignatureProperties")
            
            signing_time = etree.SubElement(signed_sig_props, f"{{{etsi}}}SigningTime")
            # Force Ecuador Timezone (-05:00) to ensure SRI accepts it against the UTC NotBefore of the cert
            signing_time.text = datetime.now().strftime("%Y-%m-%dT%H:%M:%S") + "-05:00"
            
            signing_cert = etree.SubElement(signed_sig_props, f"{{{etsi}}}SigningCertificate")
            cert_node = etree.SubElement(signing_cert, f"{{{etsi}}}Cert")
            
            cert_digest_node = etree.SubElement(cert_node, f"{{{etsi}}}CertDigest")
            etree.SubElement(cert_digest_node, f"{{{ds}}}DigestMethod", Algorithm="http://www.w3.org/2000/09/xmldsig#sha1")
            etree.SubElement(cert_digest_node, f"{{{ds}}}DigestValue").text = cert_digest_b64
            
            issuer_serial = etree.SubElement(cert_node, f"{{{etsi}}}IssuerSerial")
            etree.SubElement(issuer_serial, f"{{{ds}}}X509IssuerName").text = issuer_name
            etree.SubElement(issuer_serial, f"{{{ds}}}X509SerialNumber").text = str(serial_number)
            
            # 4. Canonicalización y Hash de SignedProperties
            # CUIDADO: C14N de este nodo debe ser EXCLUSIVA para ser robusto al envoltorio, 
            # pero SRI acepta C14N normal. Probamos normal.
            # Importante: El nodo debe tener namespaces declarados para c14n correcto aislado.
            signed_props_c14n = etree.tostring(signed_props, method="c14n", exclusive=False, with_comments=False)
            signed_props_digest = base64.b64encode(hashlib.sha1(signed_props_c14n).digest()).decode()
            
            # 5. Construir SignedInfo
            signed_info = etree.Element(f"{{{ds}}}SignedInfo", Id=signed_info_id, nsmap=nsmap)
            etree.SubElement(signed_info, f"{{{ds}}}CanonicalizationMethod", Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315")
            etree.SubElement(signed_info, f"{{{ds}}}SignatureMethod", Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256")
            
            # Reference Comprobante
            ref_doc = etree.SubElement(signed_info, f"{{{ds}}}Reference", Id=reference_id, URI="#comprobante")
            transforms = etree.SubElement(ref_doc, f"{{{ds}}}Transforms")
            etree.SubElement(transforms, f"{{{ds}}}Transform", Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature")
            etree.SubElement(ref_doc, f"{{{ds}}}DigestMethod", Algorithm="http://www.w3.org/2000/09/xmldsig#sha1")
            etree.SubElement(ref_doc, f"{{{ds}}}DigestValue").text = doc_digest
            
            # Reference SignedProperties
            ref_props = etree.SubElement(signed_info, f"{{{ds}}}Reference", URI=f"#{signed_props_id}", Type="http://uri.etsi.org/01903#SignedProperties")
            # Probar sin Transforms para propiedades (a veces requieren c14n transform explicita)
            # SRI suele requerir canonicalización aquí? XAdES estándar dice que se hashea el C14N bytes.
            etree.SubElement(ref_props, f"{{{ds}}}DigestMethod", Algorithm="http://www.w3.org/2000/09/xmldsig#sha1")
            etree.SubElement(ref_props, f"{{{ds}}}DigestValue").text = signed_props_digest
            
            # 6. Firmar SignedInfo
            signed_info_c14n = etree.tostring(signed_info, method="c14n", exclusive=False, with_comments=False)
            
            signature_val = self._key.sign(
                signed_info_c14n,
                padding.PKCS1v15(),
                hashes.SHA256()
            )
            signature_val_b64 = base64.b64encode(signature_val).decode()
            
            # 7. Construir Bloque Signature completo
            signature = etree.Element(f"{{{ds}}}Signature", Id=signature_id, nsmap=nsmap)
            signature.append(signed_info)
            
            sig_value = etree.SubElement(signature, f"{{{ds}}}SignatureValue", Id=f"SignatureValue-{uuid4()}")
            sig_value.text = signature_val_b64
            
            # KeyInfo
            key_info = etree.SubElement(signature, f"{{{ds}}}KeyInfo", Id=key_info_id)
            x509_data = etree.SubElement(key_info, f"{{{ds}}}X509Data")
            
            # Cert principal y cadena
            cert_pem_clean = self._clean_pem(self._cert)
            etree.SubElement(x509_data, f"{{{ds}}}X509Certificate").text = cert_pem_clean
            
            for ac in self._additional_certs:
                 ac_pem_clean = self._clean_pem(ac)
                 etree.SubElement(x509_data, f"{{{ds}}}X509Certificate").text = ac_pem_clean

            # Object (XAdES)
            object_node = etree.SubElement(signature, f"{{{ds}}}Object", Id=f"SignatureObject-{uuid4()}")
            object_node.append(qualifying_props)
            
            # 8. Unir al documento original
            # Append signature to root
            root.append(signature)
            
            return etree.tostring(root, encoding='utf-8', xml_declaration=True)

        except Exception as e:
            # print tracing if needed
            raise ValueError(f"Error manual XAdES: {str(e)}")

    def _clean_pem(self, cert):
        pem = cert.public_bytes(serialization.Encoding.PEM).decode()
        # Remove headers
        lines = pem.split('\n')
        clean_lines = [l for l in lines if '-----' not in l and l.strip()]
        return "".join(clean_lines)

    def cleanup(self):
        self.p12_data = None
        self.p12_password = None
        self._key = None
        self._cert = None
