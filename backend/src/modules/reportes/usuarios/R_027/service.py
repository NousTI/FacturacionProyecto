from uuid import UUID
from typing import Dict, Any
from .repository import RepositorioR027
from fastapi import Depends

class ServicioR027:
    def __init__(self, repo: RepositorioR027 = Depends()):
        self.repo = repo

    def generar_reporte_iva(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Estructura los datos para el Formulario 104 (Ventas)."""
        data = self.repo.obtener_datos_iva(empresa_id, fecha_inicio, fecha_fin)
        
        ventas_0 = 0.0
        ventas_15 = 0.0
        base_15 = 0.0
        iva_cobrado = 0.0
        
        for item in data['ventas_por_tarifa']:
            tarifa = float(item['tarifa_iva'])
            base = float(item['base_imponible'])
            iva = float(item['valor_iva'])
            
            if tarifa == 0:
                ventas_0 += base
            elif tarifa == 15:
                ventas_15 += (base + iva)
                base_15 += base
                iva_cobrado += iva
            else:
                # Otras tarifas si existieran (ej. 8%, 5%)
                base_15 += base
                iva_cobrado += iva
        
        return {
            "periodo": {
                "inicio": fecha_inicio,
                "fin": fecha_fin
            },
            "ventas": {
                "tarifa_0": ventas_0,
                "tarifa_15": ventas_15,
                "base_imponible_15": base_15,
                "iva_cobrado_15": iva_cobrado
            },
            "compras": {
                "nota": "Información no disponible (Módulo de Gastos no configurado)",
                "tarifa_0": 0.0,
                "tarifa_15": 0.0,
                "iva_pagado_15": 0.0
            },
            "resumen": {
                "iva_cobrado": iva_cobrado,
                "iva_pagado": 0.0,
                "iva_a_pagar": iva_cobrado
            }
        }
