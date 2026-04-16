from uuid import UUID
from typing import Dict, Any
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
        Filtra por tipo_iva = '4' Y tarifa_iva > 0 para excluir líneas código 4 con tarifa cero.
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
              AND fd.tipo_iva = '4'
              AND fd.tarifa_iva > 0
              AND f.fecha_emision BETWEEN %s::timestamptz AND %s::timestamptz + interval '1 day' - interval '1 second'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return dict(row) if row else {"base_imponible": 0.0, "valor_iva": 0.0}

    def obtener_ventas_por_tarifa(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """Desglose de base imponible e IVA por cada tarifa (5, 8, 12, 15, etc.)."""
        query = """
            SELECT
                fd.tarifa_iva,
                ROUND(COALESCE(SUM(fd.base_imponible), 0)::numeric, 2) AS base_imponible,
                ROUND(COALESCE(SUM(fd.valor_iva), 0)::numeric, 2)       AS valor_iva
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE f.empresa_id = %s
              AND f.estado = 'AUTORIZADA'
              AND f.tipo_documento = '01'
              AND fd.tipo_iva = '4'
              AND fd.tarifa_iva > 0
              AND f.fecha_emision BETWEEN %s::timestamptz AND %s::timestamptz + interval '1 day' - interval '1 second'
            GROUP BY fd.tarifa_iva
            ORDER BY fd.tarifa_iva DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            rows = cur.fetchall()
            result: Dict[str, Any] = {}
            for row in rows:
                tarifa = int(row['tarifa_iva'])
                result[str(tarifa)] = {
                    "base_imponible": float(row['base_imponible']),
                    "valor_iva":      float(row['valor_iva']),
                }
            return result

    def obtener_ventas_tarifa_cero(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> float:
        """
        Casillero 403: ventas tarifa 0% (base imponible).
        Filtra por tipo_iva = '0' para capturar exactamente las líneas exentas/0%.
        Casillero 405 se omite — productos no tiene flag 'con_derecho_credito'.
        """
        query = """
            SELECT
                ROUND(COALESCE(SUM(fd.base_imponible), 0)::numeric, 2) AS base_imponible
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE f.empresa_id = %s
              AND f.estado = 'AUTORIZADA'
              AND f.tipo_documento = '01'
              AND fd.tipo_iva = '0'
              AND f.fecha_emision BETWEEN %s::timestamptz AND %s::timestamptz + interval '1 day' - interval '1 second'
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return float(row['base_imponible']) if row else 0.0

    def obtener_notas_credito_emitidas(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str) -> Dict[str, Any]:
        """
        Casilleros 402/412: notas de crédito AUTORIZADAS emitidas en el período.
        Fuente: tabla notas_credito (estado_sri = 'AUTORIZADO'), no facturas.
        Se reportan en el mes de emisión de la nota, no de la factura original.
        subtotal_15_iva → base imponible (402); iva_total → IVA (412).
        """
        query = """
            SELECT
                ROUND(COALESCE(SUM(nc.subtotal_15_iva), 0)::numeric, 2) AS base_imponible,
                ROUND(COALESCE(SUM(nc.iva_total), 0)::numeric, 2)        AS valor_iva
            FROM sistema_facturacion.notas_credito nc
            JOIN sistema_facturacion.facturas f ON nc.factura_id = f.id
            WHERE f.empresa_id = %s
              AND nc.estado_sri = 'AUTORIZADO'
              AND nc.fecha_emision BETWEEN %s::timestamptz AND %s::timestamptz + interval '1 day' - interval '1 second'
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
              AND tipo_iva != '0'
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
                ROUND(COALESCE(SUM(subtotal), 0)::numeric, 2) AS base_imponible
            FROM sistema_facturacion.gastos
            WHERE empresa_id = %s
              AND tipo_iva = '0'
              AND deleted_at IS NULL
              AND fecha_emision BETWEEN %s AND %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            row = cur.fetchone()
            return float(row['base_imponible']) if row else 0.0

    # ─────────────────────────────────────────────
    # DRILL-DOWN — detalle por casillero
    # ─────────────────────────────────────────────

    def detalle_casillero_401(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str):
        """Facturas emitidas gravadas (tarifa > 0%) — casillero 401/411."""
        query = """
            SELECT
                f.numero_autorizacion,
                f.fecha_emision::date            AS fecha,
                f.numero_factura,
                f.razon_social_comprador         AS cliente,
                fd.tarifa_iva                    AS tarifa,
                ROUND(fd.base_imponible::numeric, 2) AS base_imponible,
                ROUND(fd.valor_iva::numeric, 2)      AS valor_iva
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE f.empresa_id = %s
              AND f.estado = 'AUTORIZADA'
              AND f.tipo_documento = '01'
              AND fd.tipo_iva = '4'
              AND fd.tarifa_iva > 0
              AND f.fecha_emision BETWEEN %s::timestamptz AND %s::timestamptz + interval '1 day' - interval '1 second'
            ORDER BY f.fecha_emision DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            return [dict(r) for r in cur.fetchall()]

    def detalle_casillero_403(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str):
        """Facturas emitidas tarifa 0% — casillero 403."""
        query = """
            SELECT
                f.numero_autorizacion,
                f.fecha_emision::date            AS fecha,
                f.numero_factura,
                f.razon_social_comprador         AS cliente,
                ROUND(fd.base_imponible::numeric, 2) AS base_imponible
            FROM sistema_facturacion.facturas_detalle fd
            JOIN sistema_facturacion.facturas f ON fd.factura_id = f.id
            WHERE f.empresa_id = %s
              AND f.estado = 'AUTORIZADA'
              AND f.tipo_documento = '01'
              AND fd.tipo_iva = '0'
              AND f.fecha_emision BETWEEN %s::timestamptz AND %s::timestamptz + interval '1 day' - interval '1 second'
            ORDER BY f.fecha_emision DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            return [dict(r) for r in cur.fetchall()]

    def detalle_casillero_402(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str):
        """Notas de crédito emitidas — casilleros 402/412."""
        query = """
            SELECT
                nc.numero_autorizacion,
                nc.fecha_emision::date           AS fecha,
                nc.numero_nota_credito,
                f.razon_social_comprador         AS cliente,
                ROUND(nc.subtotal_15_iva::numeric, 2) AS base_imponible,
                ROUND(nc.iva_total::numeric, 2)       AS valor_iva
            FROM sistema_facturacion.notas_credito nc
            JOIN sistema_facturacion.facturas f ON nc.factura_id = f.id
            WHERE f.empresa_id = %s
              AND nc.estado_sri = 'AUTORIZADO'
              AND nc.fecha_emision BETWEEN %s::timestamptz AND %s::timestamptz + interval '1 day' - interval '1 second'
            ORDER BY nc.fecha_emision DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            return [dict(r) for r in cur.fetchall()]

    def detalle_casillero_500(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str):
        """Gastos con IVA > 0% — casilleros 500/510."""
        query = """
            SELECT
                g.fecha_emision::date        AS fecha,
                g.numero_comprobante,
                g.proveedor,
                g.descripcion,
                g.iva                        AS tarifa,
                ROUND(g.subtotal::numeric, 2)            AS base_imponible,
                ROUND((g.total - g.subtotal)::numeric, 2) AS valor_iva
            FROM sistema_facturacion.gastos g
            WHERE g.empresa_id = %s
              AND g.tipo_iva != '0'
              AND g.deleted_at IS NULL
              AND g.fecha_emision BETWEEN %s AND %s
            ORDER BY g.fecha_emision DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            return [dict(r) for r in cur.fetchall()]

    def detalle_casillero_507(self, empresa_id: UUID, fecha_inicio: str, fecha_fin: str):
        """Gastos sin IVA (tarifa 0%) — casillero 507."""
        query = """
            SELECT
                g.fecha_emision::date        AS fecha,
                g.numero_comprobante,
                g.proveedor,
                g.descripcion,
                ROUND(g.subtotal::numeric, 2) AS base_imponible
            FROM sistema_facturacion.gastos g
            WHERE g.empresa_id = %s
              AND g.tipo_iva = '0'
              AND g.deleted_at IS NULL
              AND g.fecha_emision BETWEEN %s AND %s
            ORDER BY g.fecha_emision DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), fecha_inicio, fecha_fin))
            return [dict(r) for r in cur.fetchall()]

    # ─────────────────────────────────────────────
    # INFO EMPRESA (RUC, régimen, noveno dígito)
    # ─────────────────────────────────────────────

    def obtener_info_empresa(self, empresa_id: UUID) -> Dict[str, Any]:
        """RUC y régimen tributario de la empresa para el banner de fecha límite."""
        query = """
            SELECT ruc, razon_social, tipo_contribuyente
            FROM sistema_facturacion.empresas
            WHERE id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            if row:
                d = dict(row)
                # Normalizar: tipo_contribuyente puede ser "RIMPE", "GENERAL", etc.
                tc = (d.get("tipo_contribuyente") or "").upper()
                d["regimen_tributario"] = "rimpe" if "RIMPE" in tc else "general"
                return d
            return {"ruc": "", "razon_social": "", "tipo_contribuyente": "", "regimen_tributario": "general"}
