from fastapi import Depends
from typing import List, Optional
from uuid import UUID
from ...database.session import get_db
from ...database.transaction import db_transaction

class RepositorioClientes:
    def __init__(self, db=Depends(get_db)):
        self.db = db

    def listar_clientes(self, empresa_id: UUID) -> List[dict]:
        """Lista todos los clientes de una empresa específica"""
        query = """
            SELECT * FROM sistema_facturacion.clientes
            WHERE empresa_id = %s
            ORDER BY created_at DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            return [dict(row) for row in cur.fetchall()]

    def listar_para_exportar(self, empresa_id: UUID, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[dict]:
        """Obtiene clientes filtrados por fecha para exportación"""
        query = "SELECT * FROM sistema_facturacion.clientes WHERE empresa_id = %s"
        params = [str(empresa_id)]

        if start_date:
            query += " AND created_at >= %s"
            params.append(start_date)
        if end_date:
            # Add 23:59:59 if it's just a date to include the whole day
            if " " not in end_date:
                end_date += " 23:59:59"
            query += " AND created_at <= %s"
            params.append(end_date)

        query += " ORDER BY created_at DESC"

        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def obtener_por_id(self, id: UUID, empresa_id: Optional[UUID] = None) -> Optional[dict]:
        """Obtiene un cliente por ID, opcionalmente verifica que pertenezca a la empresa"""
        query = "SELECT * FROM sistema_facturacion.clientes WHERE id = %s"
        params = [str(id)]
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
            
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            return dict(row) if row else None

    def crear_cliente(self, datos: dict) -> Optional[dict]:
        """Crea un nuevo cliente en la base de datos"""
        fields = list(datos.keys())
        values = [str(v) if isinstance(v, UUID) else v for v in datos.values()]
        placeholders = ["%s"] * len(fields)
        
        query = f"""
            INSERT INTO sistema_facturacion.clientes ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        with db_transaction(self.db) as cur:
            try:
                cur.execute(query, tuple(values))
                row = cur.fetchone()
                return dict(row) if row else None
            except Exception as e:
                # Manejar error de duplicados (unique constraint)
                if 'uq_cliente_empresa_identificacion' in str(e):
                    raise ValueError(f"Ya existe un cliente con la identificación {datos.get('identificacion')} en esta empresa.")
                raise e

    def actualizar_cliente(self, id: UUID, datos: dict, empresa_id: Optional[UUID] = None) -> Optional[dict]:
        """Actualiza un cliente existente"""
        if not datos:
            return self.obtener_por_id(id, empresa_id)
            
        set_clauses = [f"{k} = %s" for k in datos.keys()]
        values = [str(v) if isinstance(v, UUID) else v for v in datos.values()]
        values.append(str(id))
        
        query = f"""
            UPDATE sistema_facturacion.clientes
            SET {', '.join(set_clauses)}, updated_at = NOW()
            WHERE id = %s
        """
        
        if empresa_id:
            query += " AND empresa_id = %s"
            values.append(str(empresa_id))
            
        query += " RETURNING *"
        
        with db_transaction(self.db) as cur:
            try:
                cur.execute(query, tuple(values))
                row = cur.fetchone()
                return dict(row) if row else None
            except Exception as e:
                 if 'uq_cliente_empresa_identificacion' in str(e):
                    raise ValueError(f"Ya existe un cliente con la identificación {datos.get('identificacion')} en esta empresa.")
                 raise e

    def eliminar_cliente(self, id: UUID, empresa_id: Optional[UUID] = None) -> bool:
        """Elimina un cliente (Soft delete recomendado, pero hard delete por ahora segun requerimiento anterior)"""
        query = "DELETE FROM sistema_facturacion.clientes WHERE id = %s"
        params = [str(id)]
        
        if empresa_id:
            query += " AND empresa_id = %s"
            params.append(str(empresa_id))
            
        with db_transaction(self.db) as cur:
            cur.execute(query, tuple(params))
            return cur.rowcount > 0

    def obtener_stats(self, empresa_id: UUID) -> dict:
        """Estadísticas simples para el dashboard"""
        query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE activo = true) as activos,
                COUNT(*) FILTER (WHERE limite_credito > 0) as con_credito
            FROM sistema_facturacion.clientes
            WHERE empresa_id = %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id),))
            row = cur.fetchone()
            return dict(row) if row else {"total": 0, "activos": 0, "con_credito": 0}

    # ----------------------------------------------------------------
    # R-017: CLIENTES NUEVOS POR MES
    # ----------------------------------------------------------------
    def obtener_nuevos_por_mes(self, empresa_id: UUID, meses: int = 6) -> list:
        """
        Retorna por cada mes: total de clientes registrados,
        cuántos ya hicieron su primera compra y cuántos no.
        Cubre los últimos `meses` meses desde hoy.
        """
        query = """
            WITH meses_serie AS (
                SELECT generate_series(
                    date_trunc('month', NOW() - ((%s - 1) || ' months')::interval),
                    date_trunc('month', NOW()),
                    '1 month'::interval
                ) AS mes_inicio
            ),
            nuevos AS (
                SELECT
                    date_trunc('month', c.created_at) AS mes_inicio,
                    c.id AS cliente_id
                FROM sistema_facturacion.clientes c
                WHERE c.empresa_id = %s
            ),
            con_compra AS (
                SELECT DISTINCT f.cliente_id
                FROM sistema_facturacion.facturas f
                WHERE f.empresa_id = %s
                  AND f.estado = 'AUTORIZADA'
            )
            SELECT
                TO_CHAR(m.mes_inicio, 'Month YYYY') AS mes,
                EXTRACT(YEAR  FROM m.mes_inicio)::int AS anio,
                EXTRACT(MONTH FROM m.mes_inicio)::int AS mes_numero,
                COUNT(n.cliente_id)                   AS nuevos_clientes,
                COUNT(n.cliente_id) FILTER (WHERE cc.cliente_id IS NOT NULL) AS con_primera_compra,
                COUNT(n.cliente_id) FILTER (WHERE cc.cliente_id IS NULL)     AS sin_compras
            FROM meses_serie m
            LEFT JOIN nuevos n ON n.mes_inicio = m.mes_inicio
            LEFT JOIN con_compra cc ON cc.cliente_id = n.cliente_id
            GROUP BY m.mes_inicio
            ORDER BY m.mes_inicio
        """
        with self.db.cursor() as cur:
            cur.execute(query, (meses, str(empresa_id), str(empresa_id)))
            return [dict(row) for row in cur.fetchall()]

    # ----------------------------------------------------------------
    # R-018: TOP CLIENTES
    # ----------------------------------------------------------------
    def obtener_top_clientes(
        self,
        empresa_id: UUID,
        fecha_inicio: Optional[str] = None,
        fecha_fin: Optional[str] = None,
        criterio: str = "monto",
        limit: int = 10
    ) -> list:
        """
        Retorna el ranking de clientes.
        criterio = 'monto'    -> ordena por SUM(total) DESC
        criterio = 'facturas' -> ordena por COUNT(*) DESC
        """
        date_filter = ""
        params: list = [str(empresa_id)]

        if fecha_inicio:
            date_filter += " AND f.fecha_emision >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            date_filter += " AND f.fecha_emision <= %s"
            params.append(fecha_fin)

        order_alias = "total_compras" if criterio == "monto" else "total_facturas"
        order_expr = "COALESCE(SUM(f.total), 0)" if criterio == "monto" else "COUNT(f.id)"
        params.append(limit)

        query = f"""
            SELECT
                ROW_NUMBER() OVER (ORDER BY {order_expr} DESC)::int AS ranking,
                c.id::text              AS cliente_id,
                c.razon_social,
                c.email,
                c.telefono,
                COUNT(f.id)             AS total_facturas,
                COALESCE(SUM(f.total), 0)                          AS total_compras,
                COALESCE(AVG(f.total), 0)                          AS ticket_promedio,
                MAX(f.fecha_emision::date)                         AS ultima_compra
            FROM sistema_facturacion.clientes c
            JOIN sistema_facturacion.facturas f
                ON f.cliente_id = c.id
               AND f.empresa_id = %s
               AND f.estado = 'AUTORIZADA'
               {date_filter}
            GROUP BY c.id, c.razon_social, c.email, c.telefono
            ORDER BY {order_alias} DESC
            LIMIT %s
        """
        with self.db.cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    # ----------------------------------------------------------------
    # R-019: CLIENTES INACTIVOS
    # ----------------------------------------------------------------
    def obtener_clientes_inactivos(self, empresa_id: UUID, dias: int = 90) -> list:
        """
        Clientes que no tienen ninguna factura AUTORIZADA en los últimos `dias` días.
        Incluye clientes que nunca compraron (ultima_factura = NULL).
        """
        query = """
            SELECT
                c.id::text            AS cliente_id,
                c.razon_social,
                c.email,
                c.telefono,
                MAX(f.fecha_emision::date)                   AS ultima_factura,
                COALESCE(
                    (CURRENT_DATE - MAX(f.fecha_emision::date)),
                    EXTRACT(DAY FROM NOW() - c.created_at)::int
                )                                            AS dias_sin_comprar,
                COALESCE(SUM(f.total), 0)                   AS total_historico
            FROM sistema_facturacion.clientes c
            LEFT JOIN sistema_facturacion.facturas f
                ON f.cliente_id = c.id
               AND f.empresa_id = c.empresa_id
               AND f.estado = 'AUTORIZADA'
            WHERE c.empresa_id = %s
              AND c.activo = true
            GROUP BY c.id, c.razon_social, c.email, c.telefono, c.created_at
            HAVING
                MAX(f.fecha_emision) IS NULL
                OR MAX(f.fecha_emision) < NOW() - (%s || ' days')::interval
            ORDER BY dias_sin_comprar DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (str(empresa_id), dias))
            return [dict(row) for row in cur.fetchall()]

    # ----------------------------------------------------------------
    # R-020: ANÁLISIS DE SEGMENTACIÓN
    # ----------------------------------------------------------------
    def obtener_segmentacion_clientes(self, empresa_id: UUID, periodo_meses: int = 3) -> list:
        """
        Clasifica clientes activos según su frecuencia de compra en los últimos
        `periodo_meses` meses:
          FRECUENTES  : > 10 facturas
          REGULARES   : 5-10 facturas
          OCASIONALES : 1-4 facturas
          NUEVOS      : 0 facturas en el período, registrado en el período
        Retorna cada cliente con su segmento y monto para calcular Pareto.
        """
        query = """
            WITH periodo AS (
                SELECT NOW() - (%s || ' months')::interval AS inicio
            ),
            metricas AS (
                SELECT
                    c.id::text       AS cliente_id,
                    c.razon_social,
                    c.created_at,
                    COUNT(f.id)      AS facturas_periodo,
                    COALESCE(SUM(f.total), 0) AS monto_periodo
                FROM sistema_facturacion.clientes c
                LEFT JOIN sistema_facturacion.facturas f
                    ON f.cliente_id = c.id
                   AND f.empresa_id = c.empresa_id
                   AND f.estado = 'AUTORIZADA'
                   AND f.fecha_emision >= (SELECT inicio FROM periodo)
                WHERE c.empresa_id = %s
                  AND c.activo = true
                GROUP BY c.id, c.razon_social, c.created_at
            )
            SELECT
                cliente_id,
                razon_social,
                facturas_periodo,
                monto_periodo,
                CASE
                    WHEN facturas_periodo > 10                           THEN 'FRECUENTES'
                    WHEN facturas_periodo BETWEEN 5 AND 10              THEN 'REGULARES'
                    WHEN facturas_periodo BETWEEN 1 AND 4               THEN 'OCASIONALES'
                    WHEN facturas_periodo = 0
                         AND created_at >= (SELECT inicio FROM periodo)  THEN 'NUEVOS'
                    ELSE 'INACTIVOS'
                END AS segmento
            FROM metricas
            ORDER BY monto_periodo DESC
        """
        with self.db.cursor() as cur:
            cur.execute(query, (periodo_meses, str(empresa_id)))
            return [dict(row) for row in cur.fetchall()]

