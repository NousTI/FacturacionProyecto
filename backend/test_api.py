import os
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
secret = os.getenv("SECRET_KEY", "your-super-secret-key")
algo = os.getenv("ALGORITHM", "HS256")

# Let's generate a token for user 5bb20284-0a2d-416c-b6fc-da8add39d9dd (who is mapped to the vendor that owns the company)
payload = {
    "sub": "5bb20284-0a2d-416c-b6fc-da8add39d9dd",
    "id": "5bb20284-0a2d-416c-b6fc-da8add39d9dd",
    "email": "test@test.com",
    "is_vendedor": True,
    "is_superadmin": False,
    "exp": datetime.utcnow() + timedelta(days=1)
}
token = jwt.encode(payload, secret, algorithm=algo)

import requests
resp = requests.get("http://localhost:8000/api/v1/vendedores/me/home-data", headers={"Authorization": f"Bearer {token}"})
print(resp.status_code)
print(resp.json())
