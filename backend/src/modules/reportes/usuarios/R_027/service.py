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
        ventas_grav      = self.repo.obtener_ventas_gravadas(empresa_id, fecha_inicio, fecha_fin)
        ventas_0         = self.repo.obtener_ventas_tarifa_cero(empresa_id, fecha_inicio, fecha_fin)
        nc_emitidas      = self.repo.obtener_notas_credito_emitidas(empresa_id, fecha_inicio, fecha_fin)
        ventas_por_tarifa = self.repo.obtener_ventas_por_tarifa(empresa_id, fecha_inicio, fecha_fin)

        # Período anterior — para factor comparativo
        ventas_grav_prev = self.repo.obtener_ventas_gravadas(empresa_id, prev_inicio, prev_fin)
        ventas_0_prev    = self.repo.obtener_ventas_tarifa_cero(empresa_id, prev_inicio, prev_fin)

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

        # Casillero 403 (tarifa 0% sin derecho a crédito)
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
        c401_bruto_prev = round(float(ventas_grav_prev['base_imponible']), 2)
        c403_prev       = round(ventas_0_prev, 2)
        denom_prev      = c401_bruto_prev + c403_prev
        c563_prev       = round(c401_bruto_prev / denom_prev, 4) if denom_prev > 0 else 1.0

        # ── BLOQUE 500: COMPRAS (desde gastos) ─────────────────────────
        compras_grav = self.repo.obtener_compras_gravadas(empresa_id, fecha_inicio, fecha_fin)
        compras_0    = self.repo.obtener_compras_tarifa_cero(empresa_id, fecha_inicio, fecha_fin)

        # Casillero 500/510
        c500 = round(float(compras_grav['base_imponible']), 2)
        c510 = round(float(compras_grav['valor_iva']), 2)

        # Casillero 507 (compras 0%)
        c507 = round(compras_0, 2)

        # Casillero 563: factor de proporcionalidad
        # Fórmula: (401 + 405 + 407 + 408) / (401 + 403 + 405 + 407 + 408)
        # 405/407/408 = 0 por ahora (no hay exportaciones ni flag con derecho)
        denominador_563 = c401_neto + c403
        c563 = round(c401_neto / denominador_563, 4) if denominador_563 > 0 else 1.0

        # Casillero 564: crédito tributario aplicable
        # Fórmula: (510 + 511 + 513 + 514 + 515) * 563
        # 511/513/514/515 = 0 (activos fijos y exterior no disponibles)
        c564 = round(c510 * c563, 2)

        # Casillero 599 = total IVA pagado compras
        c599 = c510

        # ── BLOQUE 600: LIQUIDACIÓN ─────────────────────────────────────
        # Casillero 601 (impuesto causado) = 499 - 564, solo si > 0
        diferencia_600 = round(c499 - c564, 2)
        c601 = round(diferencia_600, 2) if diferencia_600 > 0 else 0.0
        c602 = round(abs(diferencia_600), 2) if diferencia_600 < 0 else 0.0

        # Casillero 605 (arrastre adquisiciones mes anterior) — no hay historial en BD
        c605 = 0.0  # pendiente: requiere tabla de historial declaraciones

        # Casillero 606 (arrastre retenciones mes anterior) — no hay historial
        c606 = 0.0  # pendiente: requiere tabla de historial declaraciones

        # Casillero 609 (retenciones recibidas) — no hay tabla de retenciones recibidas
        c609 = 0.0

        # Casillero 699 = 601 - 605 - 606 - 609
        c699 = round(max(c601 - c605 - c606 - c609, 0), 2)

        # Casillero 801 = viene del 699
        c801 = c699

        # Casillero 999 = 801 + 802 (802 = 0 sin bloque 700)
        c999 = c801

        # ── BLOQUE 700: RETENCIONES EFECTUADAS ─────────────────────────
        # Sin tabla de retenciones efectuadas a proveedores — bloque vacío.
        bloque_700 = {
            "disponible": False,
        }

        # ── KPIs superiores ─────────────────────────────────────────────
        # Factor tooltip
        pct_tarifa_cero = round((c403 / (c401_bruto + c403) * 100), 1) if (c401_bruto + c403) > 0 else 0.0
        factor_tooltip = (
            f"Tu factor es {c563:.4f} porque el {pct_tarifa_cero}% de tus ventas fueron en tarifa 0% "
            f"sin derecho a crédito. Esto significa que puedes recuperar el {round(c563 * 100, 2)}% "
            f"del IVA de tus compras."
        )

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
                "iva_a_pagar":        {"valor": c699,  "label": "IVA a pagar SRI",       "sublabel": "proyectado"},
                "credito_tributario": {"valor": c602,  "label": "Crédito tributario",     "sublabel": "disponible"},
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
