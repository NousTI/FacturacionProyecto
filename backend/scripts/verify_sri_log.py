
import requests
import psycopg2
import uuid
import sys
import json
from datetime import datetime

# Config
API_URL = "http://127.0.0.1:8000"
DB_HOST = "localhost"
DB_NAME = "facturacion_db"
DB_USER = "postgres"
DB_PASS = "admin" # Adjust if known/needed, or assume running on machine where peer/trusted is used or verify later.
# Actually I don't know the DB pass for sure but 'postgres'/'admin' or empty is common in dev envs.
# Let's rely on api response first, and if I can't check DB directly, I'll trust the API side effects I see or endpoint.
# But LogEmision check is crucial.
# I'll try to connect to DB. If fails, I'll list logs via API if possible.
# There is a LogEmisionService with list() but no route for it found?
# I saw `api/routes/log_emision_routes.py` earlier.

def check_logs_via_api():
    # If there is a route
    pass

def run_test():
    print("--- SRI Verification Test ---")
    
    # 1. We need a valid Factura ID to send.
    # From previous context, there is a recurring ID: b9abb0de-9910-4031-89c7-85789b41a429
    # Or I can list facturas.
    factura_id = "b9abb0de-9910-4031-89c7-85789b41a429"
    
    print(f"Triggering send for Factura: {factura_id}")
    url = f"{API_URL}/api/sri/facturas/{factura_id}/enviar"
    
    try:
        response = requests.post(url)
        print(f"Status Code: {response.status_code}")
        try:
            data = response.json()
            print(f"Response Body: {json.dumps(data, indent=2)}")
        except:
            print(f"Response Text: {response.text}")
            
    except Exception as e:
        print(f"API Call Failed: {e}")
        return

    print("\n--- Verifying LogEmision in DB ---")
    # Try connecting to DB to check log
    try:
        conn = psycopg2.connect(
            dbname="facturacion_db", 
            user="postgres", 
            password="password", # Trying common password
            host="localhost"
        )
        cur = conn.cursor()
        cur.execute("SELECT * FROM log_emision WHERE factura_id = %s ORDER BY created_at DESC LIMIT 1", (factura_id,))
        row = cur.fetchone()
        
        if row:
            print("SAFE CHECK PASSED: Log found.")
            # ...
        else:
            print("CRITICAL FAILURE: No log entry found for this attempt.")
            
        print("\n--- Verifying AutorizacionSRI in DB ---")
        cur.execute("SELECT * FROM autorizacion_sri WHERE factura_id = %s", (factura_id,))
        row_auth = cur.fetchone()
        
        if row_auth:
             print("SAFE CHECK PASSED: Authorization Record found.")
             print(f"Estado Auth: {row_auth[3]}") # Adjust index for 'estado'
             print(f"Mensajes: {row_auth[4]}")
        else:
             print("WARNING: No Authorization Record found. (Expected if SRI Reception failed before Authorization step)")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"DB Check skipped or failed (Credentials?): {e}")
        print("Please manually verify table 'log_emision'.")

if __name__ == "__main__":
    run_test()
