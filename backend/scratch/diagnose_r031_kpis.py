import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys
from datetime import date, datetime

# Try to find real env
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

import argparse

def diagnose_kpis(cur, vendedor_id, start_date, end_date):
    print(f"\n{'='*70}")
    print(f"=== DIAGNÓSTICO KPIs R-031 PARA VENDEDOR: {vendedor_id} ===")
    print(f"=== Rango evaluado: {start_date} AL {end_date} ===")
    print(f"{'='*70}")
    
    tipos = ['NUEVO', 'UPGRADE', 'RENOVACION']
    
    for t in tipos:
        print(f"\n[Analizando tipo: {t}]")
        query = f"""
            SELECT ps.id, ps.monto, ps.estado, ps.fecha_pago, ps.tipo_pago,
                   COALESCE(e.nombre_comercial, e.razon_social) as empresa,
                   e.vendedor_id
            FROM sistema_facturacion.pagos_suscripciones ps
            JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
            WHERE e.vendedor_id = %s 
              AND ps.tipo_pago = %s 
              AND ps.fecha_pago BETWEEN %s AND %s
        """
        cur.execute(query, (vendedor_id, t, start_date, end_date))
        rows = cur.fetchall()
        
        print(f"  > Encontrados con filtro exacto: {len(rows)}")
        for r in rows:
            print(f"    - ID: {r['id']} | Empresa: {r['empresa']} | Fecha: {r['fecha_pago']} | Estado: {r['estado']} | Monto: {r['monto']}")

        # Verificación sin filtro de fecha para ver si el problema es el rango
        query_soft = f"""
            SELECT ps.fecha_pago, ps.tipo_pago, ps.estado, COALESCE(e.nombre_comercial, e.razon_social) as empresa
            FROM sistema_facturacion.pagos_suscripciones ps
            JOIN sistema_facturacion.empresas e ON ps.empresa_id = e.id
            WHERE e.vendedor_id = %s AND ps.tipo_pago = %s
            ORDER BY ps.fecha_pago DESC LIMIT 5
        """
        cur.execute(query_soft, (vendedor_id, t))
        soft_rows = cur.fetchall()
        if not rows and soft_rows:
            print(f"  > AVISO: Se encontraron registros fuera del rango o con problemas de fecha:")
            for sr in soft_rows:
                print(f"    - Empresa: {sr['empresa']} | Fecha: {sr['fecha_pago']} | Estado: {sr['estado']}")

    print(f"\n--- RESUMEN DE EMPRESAS PARA ESTE VENDEDOR ---")
    cur.execute("SELECT id, COALESCE(nombre_comercial, razon_social) as nombre, created_at FROM sistema_facturacion.empresas WHERE vendedor_id = %s", (vendedor_id,))
    empresas = cur.fetchall()
    print(f"  Total empresas asignadas: {len(empresas)}")
    for emp in empresas:
        print(f"    - {emp['nombre']} (ID: {emp['id']}) | Creada: {emp['created_at']}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--vendedor", help="ID del vendedor")
    parser.add_argument("--inicio", help="Fecha inicio YYYY-MM-DD")
    parser.add_argument("--fin", help="Fecha fin YYYY-MM-DD")
    args = parser.parse_args()

    # Valores por defecto (Mes actual)
    today = date.today()
    if not args.inicio:
        args.inicio = date(today.year, today.month, 1).isoformat()
    if not args.fin:
        args.fin = today.isoformat()

    # Si no hay vendedor, intentar buscar el último que haya creado una empresa
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
        
        v_id = args.vendedor
        if not v_id:
            print("No se proporcionó --vendedor, buscando el vendedor más reciente en empresas...")
            cur.execute("SELECT vendedor_id FROM sistema_facturacion.empresas WHERE vendedor_id IS NOT NULL ORDER BY created_at DESC LIMIT 1")
            res = cur.fetchone()
            if res:
                v_id = res['vendedor_id']
                print(f"Vendedor detectado: {v_id}")
            else:
                print("No se encontró ningún vendedor en la tabla de empresas.")
                return

        diagnose_kpis(cur, v_id, args.inicio, args.fin)
            
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
