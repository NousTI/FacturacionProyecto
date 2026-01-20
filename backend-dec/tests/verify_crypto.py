import sys
import os
import base64

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.crypto import CryptoService
from utils.xml_signer import XMLSigner

def verify_crypto():
    print("--- Verifying CryptoService ---")
    master_key = "clave_maestra_muy_segura_123456" # > 32 chars? No, but hashed
    crypto = CryptoService(master_key)
    
    original_text = "SecretoSuperConfidencial123"
    encrypted = crypto.encrypt(original_text)
    print(f"Encrypted (len={len(encrypted)}): {base64.b64encode(encrypted).decode()[:20]}...")
    
    decrypted = crypto.decrypt_to_str(encrypted)
    if decrypted == original_text:
        print("PASS: Decryption successful")
    else:
        print(f"FAIL: Decrypted '{decrypted}' != '{original_text}'")

    # Test corrupted
    try:
        crypto.decrypt(encrypted[:-1])
        print("FAIL: Should have raised error for corrupted data")
    except ValueError:
        print("PASS: Corrupted data handling")

if __name__ == "__main__":
    verify_crypto()
