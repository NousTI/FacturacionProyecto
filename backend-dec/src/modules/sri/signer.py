import base64
import hashlib
from datetime import datetime
from uuid import uuid4
from lxml import etree
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

class XMLSigner:
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
        now = datetime.now(self._cert.not_valid_after_utc.tzinfo)
        if self._cert.not_valid_after_utc < now:
             raise ValueError("El certificado digital ha expirado.")

    def verify_ruc(self, expected_ruc: str):
        subject = self._cert.subject.rfc4514_string()
        if expected_ruc in subject:
             return True
        raise ValueError(f"Certificado no corresponde al emisor. RUC esperado: {expected_ruc}")

    def sign_xml(self, xml_bytes: bytes) -> bytes:
        try:
            parser = etree.XMLParser(remove_blank_text=True)
            root = etree.fromstring(xml_bytes, parser=parser)
            
            if 'id' not in root.attrib:
                root.attrib['id'] = 'comprobante'
            
            signature_id = f"Signature-{uuid4()}"
            signed_props_id = f"SignedProperties-{uuid4()}"
            signed_info_id = f"SignedInfo-{uuid4()}"
            reference_id = f"Reference-{uuid4()}"
            key_info_id = f"KeyInfo-{uuid4()}" 
            
            doc_c14n = etree.tostring(root, method="c14n", exclusive=False, with_comments=False)
            doc_digest = base64.b64encode(hashlib.sha256(doc_c14n).digest()).decode()
            
            etsi = self.NAMESPACES['etsi']
            ds = self.NAMESPACES['ds']
            nsmap = {'ds': ds, 'etsi': etsi}
            
            cert_der = self._cert.public_bytes(encoding=serialization.Encoding.DER)
            cert_digest_b64 = base64.b64encode(hashlib.sha256(cert_der).digest()).decode()
            serial_number = self._cert.serial_number
            issuer_name = self._cert.issuer.rfc4514_string() 

            qualifying_props = etree.Element(f"{{{etsi}}}QualifyingProperties", Target=f"#{signature_id}", nsmap=nsmap)
            signed_props = etree.SubElement(qualifying_props, f"{{{etsi}}}SignedProperties", Id=signed_props_id)
            signed_sig_props = etree.SubElement(signed_props, f"{{{etsi}}}SignedSignatureProperties")
            
            signing_time = etree.SubElement(signed_sig_props, f"{{{etsi}}}SigningTime")
            signing_time.text = datetime.now().strftime("%Y-%m-%dT%H:%M:%S") + "-05:00"
            
            signing_cert = etree.SubElement(signed_sig_props, f"{{{etsi}}}SigningCertificate")
            cert_node = etree.SubElement(signing_cert, f"{{{etsi}}}Cert")
            cert_digest_node = etree.SubElement(cert_node, f"{{{etsi}}}CertDigest")
            etree.SubElement(cert_digest_node, f"{{{ds}}}DigestMethod", Algorithm="http://www.w3.org/2001/04/xmlenc#sha256")
            etree.SubElement(cert_digest_node, f"{{{ds}}}DigestValue").text = cert_digest_b64
            
            issuer_serial = etree.SubElement(cert_node, f"{{{etsi}}}IssuerSerial")
            etree.SubElement(issuer_serial, f"{{{ds}}}X509IssuerName").text = issuer_name
            etree.SubElement(issuer_serial, f"{{{ds}}}X509SerialNumber").text = str(serial_number)
            
            signed_props_c14n = etree.tostring(signed_props, method="c14n", exclusive=False, with_comments=False)
            signed_props_digest = base64.b64encode(hashlib.sha256(signed_props_c14n).digest()).decode()
            
            signed_info = etree.Element(f"{{{ds}}}SignedInfo", Id=signed_info_id, nsmap=nsmap)
            etree.SubElement(signed_info, f"{{{ds}}}CanonicalizationMethod", Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315")
            etree.SubElement(signed_info, f"{{{ds}}}SignatureMethod", Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256")
            
            ref_doc = etree.SubElement(signed_info, f"{{{ds}}}Reference", Id=reference_id, URI="#comprobante")
            transforms = etree.SubElement(ref_doc, f"{{{ds}}}Transforms")
            etree.SubElement(transforms, f"{{{ds}}}Transform", Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature")
            etree.SubElement(ref_doc, f"{{{ds}}}DigestMethod", Algorithm="http://www.w3.org/2001/04/xmlenc#sha256")
            etree.SubElement(ref_doc, f"{{{ds}}}DigestValue").text = doc_digest
            
            ref_props = etree.SubElement(signed_info, f"{{{ds}}}Reference", URI=f"#{signed_props_id}", Type="http://uri.etsi.org/01903#SignedProperties")
            etree.SubElement(ref_props, f"{{{ds}}}DigestMethod", Algorithm="http://www.w3.org/2001/04/xmlenc#sha256")
            etree.SubElement(ref_props, f"{{{ds}}}DigestValue").text = signed_props_digest
            
            signed_info_c14n = etree.tostring(signed_info, method="c14n", exclusive=False, with_comments=False)
            signature_val = self._key.sign(signed_info_c14n, padding.PKCS1v15(), hashes.SHA256())
            
            signature = etree.Element(f"{{{ds}}}Signature", Id=signature_id, nsmap=nsmap)
            signature.append(signed_info)
            sig_value = etree.SubElement(signature, f"{{{ds}}}SignatureValue", Id=f"SignatureValue-{uuid4()}")
            sig_value.text = base64.b64encode(signature_val).decode()
            
            key_info = etree.SubElement(signature, f"{{{ds}}}KeyInfo", Id=key_info_id)
            x509_data = etree.SubElement(key_info, f"{{{ds}}}X509Data")
            etree.SubElement(x509_data, f"{{{ds}}}X509Certificate").text = self._clean_pem(self._cert)
            for ac in self._additional_certs:
                 etree.SubElement(x509_data, f"{{{ds}}}X509Certificate").text = self._clean_pem(ac)

            object_node = etree.SubElement(signature, f"{{{ds}}}Object", Id=f"SignatureObject-{uuid4()}")
            object_node.append(qualifying_props)
            root.append(signature)
            
            return etree.tostring(root, encoding='utf-8', xml_declaration=True)
        except Exception as e:
            raise ValueError(f"Error manual XAdES: {str(e)}")

    def _clean_pem(self, cert):
        pem = cert.public_bytes(serialization.Encoding.PEM).decode()
        return "".join([l for l in pem.split('\n') if '-----' not in l and l.strip()])

    def cleanup(self):
        self.p12_data = None
        self.p12_password = None
        self._key = None
        self._cert = None
