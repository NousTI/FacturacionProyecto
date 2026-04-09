from uuid import UUID
from typing import Dict, Any
from .repository import RepositorioR026
from fastapi import Depends

class ServicioR026:
    def __init__(self, repo: RepositorioR026 = Depends()):
        self.repo = repo

    def generar_estado_resultados(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Calcula y estructura el Estado de Resultados (PyG)."""
        data = self.repo.obtener_pyg_data(empresa_id, fecha_inicio, fecha_fin)
        
        ventas_brutas = float(data['ingresos']['ventas'])
        descuentos = float(data['ingresos']['descuentos'])
        ingresos_netos = ventas_brutas - descuentos
        
        costo_ventas = float(data['costos']['costo_total'])
        utilidad_bruta = ingresos_netos - costo_ventas
        
        # Como no hay tabla de gastos operativos aún, se dejan en 0 pero con la estructura lista
        gastos_operativos = {
            "arriendo": 0.0,
            "servicios": 0.0,
            "nomina": 0.0,
            "otros": 0.0,
            "total_operativos": 0.0
        }
        
        utilidad_operacional = utilidad_bruta - gastos_operativos['total_operativos']
        
        otros_ingresos = 0.0
        gastos_financieros = 0.0
        
        utilidad_neta = utilidad_operacional + otros_ingresos - gastos_financieros
        
        return {
            "periodo": {
                "inicio": fecha_inicio,
                "fin": fecha_fin
            },
            "estructura": {
                "ingresos": {
                    "ventas": ventas_brutas,
                    "descuentos": descuentos,
                    "ingresos_netos": ingresos_netos
                },
                "costos_y_gastos": {
                    "costo_de_ventas": costo_ventas,
                    "utilidad_bruta": utilidad_bruta,
                    "gastos_operativos": gastos_operativos,
                    "utilidad_operacional": utilidad_operacional,
                    "otros_ingresos": otros_ingresos,
                    "gastos_financieros": gastos_financieros
                },
                "utilidad_neta": utilidad_neta
            }
        }
