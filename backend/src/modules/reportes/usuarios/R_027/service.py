from uuid import UUID
from typing import Dict, Any
from datetime import datetime, date
from .repository import RepositorioR027
from fastapi import Depends

# Calendarización SRI por noveno dígito del RUC
SRI_CALENDARIO = {
    '1': 10, '2': 12, '3': 14, '4': 16, '5': 18,
    '6': 20, '7': 22, '8': 24, '9': 26, '0': 28,
}


def _calcular_fecha_limite(ruc: str, fecha_fin: str) -> Dict[str, Any]:
    """Calcula la fecha límite de declaración según el noveno dígito del RUC."""
    try:
        noveno = ruc[8] if len(ruc) >= 9 else '0'
        dia_limite = SRI_CALENDARIO.get(noveno, 28)
        d = datetime.strptime(fecha_fin, '%Y-%m-%d')
        # Mes siguiente
        if d.month == 12:
            mes_sig, anio_sig = 1, d.year + 1
        else:
            mes_sig, anio_sig = d.month + 1, d.year
        fecha_limite = date(anio_sig, mes_sig, dia_limite)
        hoy = date.today()
        dias_restantes = (fecha_limite - hoy).days
        return {
            "noveno_digito": noveno,
            "dia_limite": dia_limite,
            "fecha_limite": fecha_limite.strftime('%d de %B de %Y'),
            "dias_restantes": dias_restantes,
            "vencida": dias_restantes < 0,
            "urgente": 0 <= dias_restantes <= 5,
        }
    except Exception:
        return {"noveno_digito": "?", "dia_limite": 28, "fecha_limite": "-", "dias_restantes": None, "vencida": False, "urgente": False}


class ServicioR027:
    def __init__(self, repo: RepositorioR027 = Depends()):
        self.repo = repo

    def detalle_casillero(self, empresa_id: UUID, casillero: str, fecha_inicio: str, fecha_fin: str):
        """Devuelve el listado de documentos que componen un casillero."""
        metodos = {
            '401': self.repo.detalle_casillero_401,
            '403': self.repo.detalle_casillero_403,
            '402': self.repo.detalle_casillero_402,
            '500': self.repo.detalle_casillero_500,
            '507': self.repo.detalle_casillero_507,
        }
        fn = metodos.get(casillero)
        if not fn:
            return []
        rows = fn(empresa_id, fecha_inicio, fecha_fin)
        # Serializar fechas y decimales
        result = []
        for r in rows:
            row = {}
            for k, v in r.items():
                if hasattr(v, 'isoformat'):
                    row[k] = v.isoformat()
                else:
                    row[k] = float(v) if hasattr(v, '__float__') and not isinstance(v, (int, str, bool)) else v
            result.append(row)
        return result

    def generar_reporte_iva(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """
        Formula 104 — Declaración de IVA.
        Bloques: 400 (ventas), 500 (compras/gastos), 600 (liquidación), 700 (retenciones).
        """

        empresa = self.repo.obtener_info_empresa(empresa_id)
        ruc = empresa.get("ruc", "")
        regimen = empresa.get("regimen_tributario", "general")
        fecha_limite_info = _calcular_fecha_limite(ruc, fecha_fin)

        # ── PERÍODO ANTERIOR (para comparativas) ────────────────────────
        d1 = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        d2 = datetime.strptime(fecha_fin, '%Y-%m-%d')
        delta_dias = (d2 - d1).days + 1
        from datetime import timedelta
        prev_inicio = (d1 - timedelta(days=delta_dias)).strftime('%Y-%m-%d')
        prev_fin    = (d1 - timedelta(days=1)).strftime('%Y-%m-%d')

        # ── BLOQUE 400: VENTAS ──────────────────────────────────────────
        ventas_grav       = self.repo.obtener_ventas_gravadas(empresa_id, fecha_inicio, fecha_fin)
        ventas_0          = self.repo.obtener_ventas_tarifa_cero(empresa_id, fecha_inicio, fecha_fin)
        nc_emitidas       = self.repo.obtener_notas_credito_emitidas(empresa_id, fecha_inicio, fecha_fin)
        ventas_por_tarifa = self.repo.obtener_ventas_por_tarifa(empresa_id, fecha_inicio, fecha_fin)

        # Período anterior — para factor comparativo
        ventas_grav_prev = self.repo.obtener_ventas_gravadas(empresa_id, prev_inicio, prev_fin)

        # Casillero 401 (bruto antes de NC) / 411
        c401_bruto = round(float(ventas_grav['base_imponible']), 2)
        c411_bruto = round(float(ventas_grav['valor_iva']), 2)

        # Casillero 402/412 (notas de crédito emitidas)
        c402 = round(float(nc_emitidas['base_imponible']), 2)
        c412 = round(float(nc_emitidas['valor_iva']), 2)

        # Validación: NC no puede superar ventas del mes
        nc_supera_ventas = c402 > c401_bruto

        # Casillero 401 neto = bruto - NC
        c401_neto = round(c401_bruto - c402, 2)
        c411_neto = round(c411_bruto - c412, 2)

        # Casillero 403 — todas las líneas tipo_iva='0' de facturas emitidas autorizadas
        c403 = round(ventas_0, 2)

        # Casillero 499 = IVA total generado en ventas (neto)
        c499 = round(c411_neto, 2)

        # KPI: base imponible de la tarifa principal (mayor base del período)
        tarifa_principal = max(ventas_por_tarifa.items(), key=lambda x: x[1]['base_imponible'], default=('15', {'base_imponible': 0.0}))[0] if ventas_por_tarifa else '15'
        kpi_tarifa_principal = {
            "tarifa": tarifa_principal,
            "base_imponible": ventas_por_tarifa.get(tarifa_principal, {}).get('base_imponible', 0.0),
        }

        # Factor del período anterior (para comparativa en KPI)
        # 403 prev = 0 — sin datos de tarifa 0% (mismo criterio que período actual)
        c401_bruto_prev = round(float(ventas_grav_prev['base_imponible']), 2)
        c563_prev       = 1.0 if c401_bruto_prev == 0 else 1.0

        # ── BLOQUE 500: COMPRAS (desde gastos) ─────────────────────────
        compras_grav = self.repo.obtener_compras_gravadas(empresa_id, fecha_inicio, fecha_fin)
        compras_0    = self.repo.obtener_compras_tarifa_cero(empresa_id, fecha_inicio, fecha_fin)

        # Casillero 500/510
        c500 = round(float(compras_grav['base_imponible']), 2)
        c510 = round(float(compras_grav['valor_iva']), 2)

        # Casillero 507 (compras 0%)
        c507 = round(compras_0, 2)

        # Casillero 563/564 — sin datos suficientes: falta 405/407/408 para factor real
        c563 = None
        c564 = None

        # Casillero 599 = total IVA pagado compras
        c599 = c510

        # ── BLOQUE 600: LIQUIDACIÓN ─────────────────────────────────────
        # 601/602: sin 564 no se puede calcular — None
        c601 = None
        c602 = None

        # 605/606/609 — sin historial ni tabla de retenciones
        c605 = None
        c606 = None
        c609 = None

        # 699 = 601 - 605 - 606 - 609 — sin los anteriores no se puede calcular
        c699 = None

        # 801 viene del 699
        c801 = None

        # 999 = 801 + 802
        c999 = None

        # Bloque 700 — sin tabla de retenciones efectuadas
        bloque_700 = {"disponible": False}

        # KPI factor — sin datos suficientes
        factor_tooltip = "Sin información disponible: faltan datos de exportaciones y ventas 0% clasificadas."

        return {
            "empresa": {
                "ruc": ruc,
                "razon_social": empresa.get("razon_social", ""),
                "regimen": regimen,
            },
            "periodo": {
                "inicio": fecha_inicio,
                "fin": fecha_fin,
            },
            "fecha_limite": fecha_limite_info,

            # KPIs superiores
            "kpis": {
                "iva_a_pagar":        {"valor": None, "label": "IVA a pagar SRI",    "sublabel": "sin datos suficientes"},
                "credito_tributario": {"valor": None, "label": "Crédito tributario", "sublabel": "sin datos suficientes"},
                "ventas_tarifa_principal": {
                    "tarifa":         tarifa_principal,
                    "valor":          kpi_tarifa_principal["base_imponible"],
                    "label":          f"Ventas tarifa {tarifa_principal}%",
                    "sublabel":       "base imponible",
                },
                "factor": {
                    "valor":          c563,
                    "valor_anterior": c563_prev,
                    "label":          "Factor de este mes",
                    "sublabel":       "proporcionalidad",
                    "tooltip":        factor_tooltip,
                },
            },

            # BLOQUE 400
            "bloque_400": {
                "c401_bruto": c401_bruto,
                "c401_neto":  c401_neto,
                "c411_bruto": c411_bruto,
                "c411_neto":  c411_neto,
                "c403":       c403,
                "c402":       c402,
                "c412":       c412,
                "c499":       c499,
                # Omitidos por falta de data: 405/415, 407/417, 408/418, 431
                "alertas": {
                    "nc_supera_ventas": nc_supera_ventas,
                },
            },

            # BLOQUE 500
            "bloque_500": {
                "c500":  c500,
                "c510":  c510,
                "c507":  c507,
                "c563":  c563,
                "c564":  c564,
                "c599":  c599,
            },

            # BLOQUE 600
            "bloque_600": {
                "c601":  c601,
                "c602":  c602,
                "c605":  c605,
                "c606":  c606,
                "c609":  c609,
                "c699":  c699,
            },

            # BLOQUE 700
            "bloque_700": bloque_700,

            # BLOQUE 800/900
            "bloque_900": {
                "c801": c801,
                "c802": 0.0,
                "c897": 0.0,  # mora — omitido: sin historial de declaraciones anteriores
                "c898": 0.0,  # multas — omitido
                "c999": c999,
            },
        }
