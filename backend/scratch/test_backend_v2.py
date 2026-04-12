import requests
import json
import uuid

# Configuration
BASE_URL = "http://localhost:8000"  # Assuming default FastAPI port
# Note: In a real test, we would need a valid JWT token. 
# Since I can't easily get one without login, I'll test the internal logic via a python script that mocks the DB or use the repository directly.

# Testing via Repository (Internal Logic)
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password" 
        DB_PORT = 5432
    env = MockEnv()

def test_backend_logic():
    conn = None
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT,
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        # 1. Verify Establecimientos has es_matriz
        cur.execute("SELECT es_matriz FROM sistema_facturacion.establecimientos LIMIT 1;")
        row = cur.fetchone()
        print(f"Establecimiento es_matriz: {row['es_matriz']}")

        # 2. Verify Puntos Emision has new sequentials and NO secuencial_actual
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'puntos_emision' AND table_schema = 'sistema_facturacion';")
        columns = [r['column_name'] for r in cur.fetchall()]
        
        required = ['secuencial_factura', 'secuencial_nota_credito', 'secuencial_nota_debito', 'secuencial_retencion', 'secuencial_guia_remision', 'telefono']
        for col in required:
            if col in columns:
                print(f"Column {col}: OK")
            else:
                print(f"Column {col}: MISSING")
        
        if 'secuencial_actual' not in columns:
            print("Legacy Column secuencial_actual: REMOVED (OK)")
        else:
            print("Legacy Column secuencial_actual: STILL PRESENT (FAIL)")

        # 3. Test Incrementar Secuencial logic
        from src.modules.puntos_emision.repository import RepositorioPuntosEmision
        repo = RepositorioPuntosEmision(conn)
        
        # Find a point
        cur.execute("SELECT id, secuencial_factura FROM sistema_facturacion.puntos_emision LIMIT 1;")
        point = cur.fetchone()
        if point:
            pid = point['id']
            old_val = point['secuencial_factura']
            print(f"Testing increment for point {pid}, current factura: {old_val}")
            
            # Use the repo method
            new_val_returned = repo.incrementar_secuencial(pid, 'factura')
            
            cur.execute("SELECT secuencial_factura FROM sistema_facturacion.puntos_emision WHERE id = %s;", (str(pid),))
            new_val_db = cur.fetchone()['secuencial_factura']
            
            print(f"Returned value (should be old): {new_val_returned}")
            print(f"New DB value (should be old+1): {new_val_db}")
            
            if new_val_returned == old_val and new_val_db == old_val + 1:
                print("Increment logic: OK")
            else:
                print("Increment logic: FAIL")
        
        conn.rollback() # Don't commit tests
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_backend_logic()
