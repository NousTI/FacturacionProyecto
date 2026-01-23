import sys
import os

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), "src")))

from modules.empresa.schemas import EmpresaBase
from pydantic import ValidationError

test_data = {
    "ruc": "1792147742001",
    "razon_social": "Test Empresa",
    "email": "test@empresa.com",
    "telefono": "1234567", # Invalid length (7 digits)
    "direccion": "Av. Siempre Viva 123",
    "tipo_contribuyente": "PERSONA_JURIDICA",
    "obligado_contabilidad": False
}

print("Testing with 7-digit phone...")
try:
    EmpresaBase(**test_data)
    print("FAILED: Schema accepted 7-digit phone")
except ValidationError as e:
    print("SUCCESS: Schema rejected 7-digit phone")
    # print(e)

test_data["telefono"] = "0999999999" # 10 digits
print("\nTesting with 10-digit phone...")
try:
    EmpresaBase(**test_data)
    print("SUCCESS: Schema accepted 10-digit phone")
except ValidationError as e:
    print(f"FAILED: Schema rejected valid 10-digit phone: {e}")

test_data["ruc"] = "1234567890" # Invalid RUC
print("\nTesting with invalid RUC length...")
try:
    EmpresaBase(**test_data)
    print("FAILED: Schema accepted short RUC")
except ValidationError as e:
    print("SUCCESS: Schema rejected short RUC")

test_data["ruc"] = "1792147742000" # Invalid RUC (ends in 000)
print("\nTesting with RUC ending in 000...")
try:
    EmpresaBase(**test_data)
    print("FAILED: Schema accepted RUC ending in 000")
except ValidationError as e:
    print("SUCCESS: Schema rejected RUC ending in 000")
