import requests
import sys

try:
    print("Testing GET http://127.0.0.1:8001/api/dashboard/overview ...")
    # We expect 401 or 403 because no token, but it should connect.
    resp = requests.get("http://127.0.0.1:8001/api/dashboard/overview", timeout=5)
    print(f"Status: {resp.status_code}")
    print(f"Content: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
