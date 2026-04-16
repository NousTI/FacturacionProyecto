import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

try:
    sys.path.append(os.getcwd())
    from src.config.env import env
except:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password"
        DB_PORT = 5432
    env = MockEnv()

FECHA_INICIO = '2026-04-01'
FECHA_FIN    = '2026-04-16'

def sep(titulo):
    print(f"\n{'='*60}")
    print(f"=== {titulo} ===")
    print(f"{'='*60}")

def main():
    conn = None
    try:
        conn = psycopg2.connect(
            host=env.DB_HOST,
            database=env.DB_NAME,
            user=env.DB_USER,
            password=env.DB_PASSWORD,
            port=env.DB_PORT,
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()

        # 1. Total pagos_suscripciones por estado
        sep("PAGOS_SUSCRIPCIONES — conteo por estado")
        cur.execute("""
            SELECT estado, COUNT(*) as total
            FROM sistema_facturacion.pagos_suscripciones
            GROUP BY estado
            ORDER BY total DESC;
        """)
        for row in cur.fetchall():
            print(f"  estado={row['estado']}  total={row['total']}")

        # 2. Pagos PAGADO en el período
        sep(f"PAGOS PAGADO en periodo {FECHA_INICIO} - {FECHA_FIN}")
        cur.execute("""
            SELECT COUNT(DISTINCT empresa_id) as empresas,
                   COUNT(*) as pagos
            FROM sistema_facturacion.pagos_suscripciones
            WHERE estado = 'PAGADO'
              AND fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second';
        """, (FECHA_INICIO, FECHA_FIN))
        row = cur.fetchone()
        print(f"  Empresas distintas: {row['empresas']}")
        print(f"  Pagos totales:      {row['pagos']}")

        # 3. Empresas que clasifican como UPGRADE (pago anterior PAGADO con distinto plan)
        sep("EMPRESAS CLASIFICADAS COMO UPGRADE en el período")
        cur.execute("""
            SELECT COUNT(DISTINCT ps.empresa_id) as empresas_upgrade
            FROM sistema_facturacion.pagos_suscripciones ps
            WHERE ps.estado = 'PAGADO'
              AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
              AND EXISTS (
                  SELECT 1 FROM sistema_facturacion.pagos_suscripciones ps2
                  WHERE ps2.empresa_id = ps.empresa_id
                    AND ps2.estado = 'PAGADO'
                    AND ps2.plan_id != ps.plan_id
                    AND ps2.fecha_pago < ps.fecha_pago
              );
        """, (FECHA_INICIO, FECHA_FIN))
        row = cur.fetchone()
        print(f"  Empresas con upgrade: {row['empresas_upgrade']}")

        # 4. Detalle: cuántos planes distintos tiene cada empresa (pagos PAGADO)
        sep("PLANES DISTINTOS POR EMPRESA (pagos PAGADO, todos los tiempos)")
        cur.execute("""
            SELECT ps.empresa_id,
                   COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                   COUNT(DISTINCT ps.plan_id) as planes_distintos,
                   MIN(ps.fecha_pago) as primer_pago,
                   MAX(ps.fecha_pago) as ultimo_pago
            FROM sistema_facturacion.pagos_suscripciones ps
            JOIN sistema_facturacion.empresas e ON e.id = ps.empresa_id
            WHERE ps.estado = 'PAGADO'
            GROUP BY ps.empresa_id, e.nombre_comercial, e.razon_social
            ORDER BY planes_distintos DESC
            LIMIT 10;
        """)
        for row in cur.fetchall():
            print(f"  {row['empresa'][:35]:<35} planes_distintos={row['planes_distintos']}  "
                  f"primer_pago={row['primer_pago']}  ultimo_pago={row['ultimo_pago']}")

        # 5. Muestra de pagos_suscripciones con plan_id para ver si los IDs cambian
        sep("MUESTRA pagos_suscripciones con plan_id (últimos 10 PAGADO)")
        cur.execute("""
            SELECT ps.empresa_id,
                   COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                   ps.plan_id,
                   p.nombre as plan_nombre,
                   ps.estado,
                   ps.fecha_pago
            FROM sistema_facturacion.pagos_suscripciones ps
            JOIN sistema_facturacion.empresas e ON e.id = ps.empresa_id
            JOIN sistema_facturacion.planes p ON p.id = ps.plan_id
            WHERE ps.estado = 'PAGADO'
            ORDER BY ps.fecha_pago DESC
            LIMIT 10;
        """)
        for row in cur.fetchall():
            print(f"  {row['empresa'][:25]:<25} plan={row['plan_nombre']:<15} "
                  f"plan_id={str(row['plan_id'])[:8]}  fecha={row['fecha_pago']}")

        # 6. Porcentaje final que calcula la query actual
        sep("PORCENTAJE UPGRADES — resultado final de la query corregida")
        cur.execute("""
            SELECT ROUND(
                COUNT(DISTINCT ps.empresa_id)::numeric /
                NULLIF((
                    SELECT COUNT(DISTINCT ps3.empresa_id)
                    FROM sistema_facturacion.pagos_suscripciones ps3
                    WHERE ps3.estado = 'PAGADO'
                      AND ps3.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
                ), 0) * 100, 1
            ) as porcentaje_upgrades
            FROM sistema_facturacion.pagos_suscripciones ps
            WHERE ps.estado = 'PAGADO'
              AND ps.fecha_pago BETWEEN %s AND %s::timestamp + interval '1 day' - interval '1 second'
              AND EXISTS (
                  SELECT 1 FROM sistema_facturacion.pagos_suscripciones ps2
                  WHERE ps2.empresa_id = ps.empresa_id
                    AND ps2.estado = 'PAGADO'
                    AND ps2.plan_id != ps.plan_id
                    AND ps2.fecha_pago < ps.fecha_pago
              );
        """, (FECHA_INICIO, FECHA_FIN, FECHA_INICIO, FECHA_FIN))
        row = cur.fetchone()
        print(f"  porcentaje_upgrades = {row['porcentaje_upgrades']}%")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback; traceback.print_exc()

if __name__ == "__main__":
    main()
