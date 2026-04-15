from uuid import UUID
from typing import Dict, Any, List
from .....database.session import get_db
from fastapi import Depends


class RepositorioR027:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    # ─────────────────────────────────────────────
    # BLOQUE 400 — VENTAS
    # Fuente: facturas_detalle + facturas (estado = AUTORIZADA)
    # ─────────────────────────────────────────────

    def obtener_ventas_gravadas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """
        Casilleros 401/411: ventas locales con tarifa > 0 (base imponible e IVA).
        Solo facturas AUTORIZADAS con tipo_documento = '01' (factura normal).
        """
        query = """
            SELECT
                ROUND(COALESCE(SUM(fd.base_imponible), 0)::numeric, 2) AS base_imponible,
                ROUND(COALESCE(SUM(fd.valor_iva), 0)::numeric, 2)       AS valor_iva
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE f.empresa_id = %s
              AND f.estado = 'AUTORIZADA'
              AND f.tipo_documento = '01'
              AND fd.tarifa_iva > 0
              AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return dict(row) if row else {"base_imponible": 0.0, "valor_iva": 0.0}

    def obtener_ventas_tarifa_cero(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> float:
        """
        Casillero 403: ventas tarifa 0% (base imponible).
        Por defecto todas las líneas 0% van al 403 (sin derecho a crédito)
        dado que no existe flag 'con_derecho_credito' en productos aún.
        Casillero 405 se omite hasta implementar dicho flag.
        """
        query = """
            SELECT
                ROUND(COALESCE(SUM(fd.base_imponible), 0)::numeric, 2) AS base_imponible
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE f.empresa_id = %s
              AND f.estado = 'AUTORIZADA'
              AND f.tipo_documento = '01'
              AND fd.tarifa_iva = 0
              AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return float(row['base_imponible']) if row else 0.0

    def obtener_notas_credito_emitidas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """
        Casilleros 402/412: notas de crédito EMITIDAS en el período (tipo_documento = '04').
        Se reportan en el mes de emisión de la nota, no de la factura original.
        """
        query = """
            SELECT
                ROUND(COALESCE(SUM(fd.base_imponible), 0)::numeric, 2) AS base_imponible,
                ROUND(COALESCE(SUM(fd.valor_iva), 0)::numeric, 2)       AS valor_iva
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE f.empresa_id = %s
              AND f.estado = 'AUTORIZADA'
              AND f.tipo_documento = '04'
              AND fd.tarifa_iva > 0
              AND f.fecha_emision BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return dict(row) if row else {"base_imponible": 0.0, "valor_iva": 0.0}

    # ─────────────────────────────────────────────
    # BLOQUE 500 — COMPRAS (desde módulo de Gastos)
    # Fuente: sistema_facturacion.gastos
    # iva = porcentaje (ej. 15.00), subtotal = base imponible
    # No hay XML de compras; gastos manuales.
    # ─────────────────────────────────────────────

    def obtener_compras_gravadas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """
        Casillero 500/510: compras con IVA > 0 (base imponible e IVA pagado).
        Con derecho a crédito tributario (todos los gastos gravados, por defecto).
        Casillero 509/519 (sin derecho) se omite — no existe clasificación en la tabla.
        """
        query = """
            SELECT
                ROUND(COALESCE(SUM(subtotal), 0)::numeric, 2)                              AS base_imponible,
                ROUND(COALESCE(SUM(total - subtotal), 0)::numeric, 2)                      AS valor_iva
            FROM sistema_facturacion.gastos
            WHERE empresa_id = %s
              AND iva > 0
              AND deleted_at IS NULL
              AND fecha_emision BETWEEN %s AND %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return dict(row) if row else {"base_imponible": 0.0, "valor_iva": 0.0}

    def obtener_compras_tarifa_cero(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> float:
        """
        Casillero 507: compras tarifa 0% (gastos con iva = 0).
        Incluye compras a negocios RIMPE/populares.
        """
        query = """
            SELECT
                ROUND(COALESCE(SUM(total), 0)::numeric, 2) AS base_imponible
            FROM sistema_facturacion.gastos
            WHERE empresa_id = %s
              AND iva = 0
              AND deleted_at IS NULL
              AND fecha_emision BETWEEN %s AND %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return float(row['base_imponible']) if row else 0.0

    # ─────────────────────────────────────────────
    # INFO EMPRESA (RUC, régimen, noveno dígito)
    # ─────────────────────────────────────────────

    def obtener_info_empresa(self, empresa_id: UUID) -> Dict[str, Any]:
        """RUC y régimen tributario de la empresa para el banner de fecha límite."""
        query = """
            SELECT ruc, razon_social, regimen_tributario
            FROM sistema_facturacion.empresas
            WHERE id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else {"ruc": "", "razon_social": "", "regimen_tributario": "general"}
