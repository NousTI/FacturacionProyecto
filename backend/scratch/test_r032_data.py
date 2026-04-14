import sys
import os
from uuid import UUID
from datetime import date

# Añadir el path del proyecto para importar módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.database.session import get_db
from src.modules.reportes.vendedores.R_032.repository import RepositorioR032Vendedor

def test_r032_logic():
    # ID de vendedor de prueba del volcado anterior
    # [Registro 1] v_id: 6f2c35a3-5a9b-4a64-9034-4806a023a59a (Comisión pagada 3.00)
    vendedor_id = UUID('6f2c35a3-5a9b-4a64-9034-4806a023a59a')
    
    db_gen = get_db()
    db = next(db_gen)
    
    repo = RepositorioR032Vendedor(db)
    
    print("=== TEST R-032 LOGIC ===")
    
    print("\n1. Probando obtener_kpis...")
    kpis = repo.obtener_kpis(vendedor_id)
    print(f"KPIs: {kpis}")
    
    print("\n2. Probando obtener_detalle_comisiones...")
    detalle = repo.obtener_detalle_comisiones(vendedor_id)
    print(f"Total registros detalle: {len(detalle)}")
    if detalle:
        print(f"Primer registro: {detalle[0]}")
    
    print("\n3. Probando obtener_grafica_comparativa...")
    grafica = repo.obtener_grafica_comparativa(vendedor_id)
    print(f"Grafica: {grafica}")

if __name__ == "__main__":
    test_r032_logic()
