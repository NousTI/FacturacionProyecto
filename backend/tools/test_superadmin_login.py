import requests

BASE_URL = "http://localhost:8001/api/autenticacion"

def test_superadmin_login():
    email = "superadmin@system.com"
    password = "password"
    data = {"correo": email, "clave": password}
    resp = requests.post(f"{BASE_URL}/iniciar-sesion", json=data)
    print("Status:", resp.status_code)
    print("Response:", resp.json())
    assert resp.status_code == 200, "Login failed"
    assert "access_token" in resp.json().get("data", {}), "No token returned"

if __name__ == "__main__":
    test_superadmin_login()
