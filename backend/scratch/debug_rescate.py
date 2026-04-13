"""
Script de diagnóstico - Zona de Rescate R-031
Ejecutar: python scratch/debug_rescate.py
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import sys, os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from src.config.env import env
    DB_KWARGS = dict(host=env.DB_HOST, database=env.DB_NAME, user=env.DB_USER, password=env.DB_PASSWORD, port=env.DB_PORT)
except Exception as e:
    print(f"Error cargando env: {e}")
    sys.exit(1)

def run(cur, label, sql, params=()):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print('='*60)
    cur.execute(sql, params)
    rows = cur.fetchall()
    if rows:
        for i, row in enumerate(rows):
            print(f"  [{i+1}]", {k: v for k, v in row.items()})
    else:
        print("  (Sin resultados)")

conn = psycopg2.connect(**DB_KWARGS, cursor_factory=RealDictCursor)
cur = conn.cursor()

# 1. Suscripciones SUSPENDIDAS o VENCIDAS
run(cur, "SUSCRIPCIONES SUSPENDIDAS o VENCIDAS", """
    SELECT s.id, s.empresa_id, s.estado, s.fecha_inicio, s.fecha_fin, e.activo, e.nombre_comercial
    FROM sistema_facturacion.suscripciones s
    JOIN sistema_facturacion.empresas e ON e.id = s.empresa_id
    WHERE s.estado IN ('VENCIDA', 'SUSPENDIDA')
    ORDER BY s.fecha_fin DESC
    LIMIT 10
""")

# 2. De esas, ¿cuántas tienen empresa.activo = FALSE?
run(cur, "SUSPENDIDAS/VENCIDAS con empresa.activo = FALSE", """
    SELECT s.id, s.empresa_id, s.estado, s.fecha_fin, e.activo, e.nombre_comercial
    FROM sistema_facturacion.suscripciones s
    JOIN sistema_facturacion.empresas e ON e.id = s.empresa_id
    WHERE s.estado IN ('VENCIDA', 'SUSPENDIDA')
      AND e.activo = FALSE
    LIMIT 10
""")

# 3. De esas, ¿cuántas tienen fecha_fin en 2026?
run(cur, "SUSPENDIDAS/VENCIDAS + activo=FALSE + fecha_fin en 2026", """
    SELECT s.id, s.empresa_id, s.estado, s.fecha_fin, e.activo, e.nombre_comercial
    FROM sistema_facturacion.suscripciones s
    JOIN sistema_facturacion.empresas e ON e.id = s.empresa_id
    WHERE s.estado IN ('VENCIDA', 'SUSPENDIDA')
      AND e.activo = FALSE
      AND s.fecha_fin BETWEEN '2026-01-01' AND '2026-12-31'
    LIMIT 10
""")

# 4. Resultado final idéntico a la query de obtener_zona_rescate (sin filtro de fechas)
run(cur, "ZONA RESCATE - SIN FILTRO DE FECHAS (query real)", """
    SELECT
        e.id,
        COALESCE(e.nombre_comercial, e.razon_social) as nombre_empresa,
        e.activo,
        s.estado as suscripcion_estado,
        s.fecha_fin as fecha_vencimiento,
        (s.fecha_fin + INTERVAL '9 days') as deadline
    FROM sistema_facturacion.empresas e
    JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
    WHERE s.estado IN ('VENCIDA', 'SUSPENDIDA')
      AND e.activo = FALSE
    ORDER BY deadline ASC
    LIMIT 10
""")

# 5. Resultado con filtro del período (mes actual)
run(cur, "ZONA RESCATE - CON FILTRO PERIODO ESTE MES", """
    SELECT
        e.id,
        COALESCE(e.nombre_comercial, e.razon_social) as nombre_empresa,
        e.activo,
        s.estado as suscripcion_estado,
        s.fecha_fin as fecha_vencimiento
    FROM sistema_facturacion.empresas e
    JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
    WHERE s.estado IN ('VENCIDA', 'SUSPENDIDA')
      AND e.activo = FALSE
      AND s.fecha_fin >= '2026-04-01'
      AND s.fecha_fin <= '2026-04-13 23:59:59'
    LIMIT 10
""")

cur.close()
conn.close()
print("\n[DIAGNÓSTICO COMPLETADO]")
