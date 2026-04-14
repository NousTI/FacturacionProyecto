import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Try to find real env
try:
    sys.path.append(os.getcwd())
    from src.modules.reportes.superadmin.R_031.repository import RepositorioR031
except:
    print("Error importing repository")
    sys.exit(1)

def main():
    try:
        # Mock database object for the repository
        from src.database.session import get_db
        db = next(get_db())
        
        repo = RepositorioR031(db=db)
        print("=== PROBANDO OBTENER_KPIS_GLOBALES ===")
        # Sin fechas o con rango de hoy
        res = repo.obtener_kpis_globales()
        print(f"Empresas Activas: {res.get('empresas_activas')}")
        print(f"Zona de Rescate: {res.get('zona_rescate')}")
        print(f"Variación (+): {res.get('empresas_nuevas_mes')}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
