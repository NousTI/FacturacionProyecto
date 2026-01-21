import sys
import os
from pprint import pprint

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from src.database.session import get_db
from src.modules.dashboards.repository import RepositorioDashboards

def test_queries():
    print("Initializing DB session...")
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        repo = RepositorioDashboards(db)
        
        print("\n--- Testing obtener_estadisticas_generales ---")
        stats = repo.obtener_estadisticas_generales()
        pprint(stats)

        print("\n--- Testing obtener_kpis_principales ---")
        kpis = repo.obtener_kpis_principales()
        pprint(kpis)

        print("\n--- Testing obtener_alertas_sistema ---")
        alerts = repo.obtener_alertas_sistema()
        pprint(alerts)
        
        print("\n--- Testing obtener_ingresos_mensuales ---")
        income = repo.obtener_ingresos_mensuales()
        pprint(income[:2]) # show first 2
        
        print("\nSUCCESS: All queries executed without error.")

    except Exception as e:
        print(f"\nFAILURE: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_queries()
