import psycopg2
from psycopg2.extras import RealDictCursor
import sys
import os
from uuid import UUID

sys.path.append(os.getcwd())
from src.config.env import env
from src.modules.gastos.gasto_repository import RepositorioGastos
from src.database.session import get_db

def test_obtener_por_id():
    # Use the ID from the user's error message
    test_id = 'a6f547bf-2844-41b4-a344-25f198ac4fc3'
    
    conn = psycopg2.connect(
        host=env.DB_HOST,
        database=env.DB_NAME,
        user=env.DB_USER,
        password=env.DB_PASSWORD,
        port=env.DB_PORT,
        cursor_factory=RealDictCursor
    )
    
    try:
        repo = RepositorioGastos(conn)
        gasto = repo.obtener_por_id(UUID(test_id))
        print("RESULTADO OBTENER_POR_ID:")
        print(gasto)
        if gasto:
            print(f"¿Tiene saldo?: {'saldo' in gasto}")
            print(f"Valor de saldo: {gasto.get('saldo')}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_obtener_por_id()
