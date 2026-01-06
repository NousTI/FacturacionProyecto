
import os
import sys
import base64
import psycopg2
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import pkcs12
from dotenv import load_dotenv

# Add backend to path to import utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from utils.crypto import CryptoService

load_dotenv()

CERT_MASTER_KEY = os.getenv("CERT_MASTER_KEY")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "sistema_facturacion")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "password")

def inspect_cert():
    if not CERT_MASTER_KEY:
        print("ERROR: CERT_MASTER_KEY missing in .env")
        return

    try:
        conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASS)
        cur = conn.cursor()
        
        # Get the first config or specific one
        # Assuming we are checking the one related to the problematic invoice
        # but let's just check ALL active configs to be safe.
        cur.execute("SELECT id, empresa_id, certificado_digital, clave_certificado FROM configuracion_sri WHERE firma_activa = true")
        rows = cur.fetchall()
        
        print("\n--- INSPECCION DE CERTIFICADOS ---")
        crypto = CryptoService(CERT_MASTER_KEY)
        
        for row in rows:
            conf_id, emp_id, cert_enc, pass_enc_b64 = row
            print(f"\nEmpresa ID: {emp_id}")
            
            try:
                # Decrypt Password
                pass_enc = base64.b64decode(pass_enc_b64)
                password = crypto.decrypt_to_str(pass_enc)
                
                # Decrypt P12
                # Ensure bytes
                if isinstance(cert_enc, memoryview):
                    cert_enc = bytes(cert_enc)
                p12_bytes = crypto.decrypt(cert_enc)
                
                # Load P12
                private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
                    p12_bytes, 
                    password.encode('utf-8'), 
                    default_backend()
                )
                
                subject = certificate.subject
                print(f"Subject RFC4514: {subject.rfc4514_string()}")
                print("Subject Fields:")
                for attribute in subject:
                    print(f"  - {attribute.oid._name}: {attribute.value}")
                
                print(f"Issuer: {certificate.issuer}")
                print(f"Not Before: {certificate.not_valid_before}")
                print(f"Not After: {certificate.not_valid_after}")
                
            except Exception as e:
                print(f"  ERROR Decrypting/Reading: {e}")
                
        conn.close()
        
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    inspect_cert()
