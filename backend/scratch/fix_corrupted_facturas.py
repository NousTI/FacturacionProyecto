import psycopg2
from psycopg2.extras import RealDictCursor, Json
import os
import sys
import json
from datetime import datetime

# Intentar cargar configuración del proyecto
try:
    sys.path.append(os.getcwd())
    from backend.src.config.env import env
except ImportError:
    class MockEnv:
        DB_HOST = "localhost"
        DB_NAME = "sistema_facturacion"
        DB_USER = "postgres"
        DB_PASSWORD = "password" 
        DB_PORT = 5432
    env = MockEnv()

def fix_facturas():
    try:
        conn = psycopg2.connect(
            host=getattr(env, 'DB_HOST', 'localhost'),
            database=getattr(env, 'DB_NAME', 'sistema_facturacion'),
            user=getattr(env, 'DB_USER', 'postgres'),
            password=getattr(env, 'DB_PASSWORD', 'password'),
            port=getattr(env, 'DB_PORT', 5432),
            cursor_factory=RealDictCursor
        )
        cur = conn.cursor()
        
        print("=== Iniciando Reparación de Facturas Corruptas (v2) ===")
        
        # 1. Obtener facturas con cualquier problema de snapshots o totales
        # Agregamos validación para snapshot_usuario huérfano o incompleto
        query = """
            SELECT f.*, 
                   c.razon_social as c_razon, c.identificacion as c_id, c.tipo_identificacion as c_tipo, c.email as c_email, c.direccion as c_dir,
                   e.razon_social as e_razon, e.ruc as e_ruc, e.direccion as e_dir, e.tipo_contribuyente as e_tipo, e.obligado_contabilidad as e_obligado, e.email as e_email,
                   es.codigo as es_codigo, es.nombre as es_nombre, es.direccion as es_dir,
                   pe.codigo as pe_codigo, pe.nombre as pe_nombre,
                   u.nombres as u_nombres, u.apellidos as u_apellidos, usaut.email as u_email,
                   er.codigo as u_rol_codigo, er.nombre as u_rol_nombre
            FROM sistema_facturacion.facturas f
            LEFT JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
            LEFT JOIN sistema_facturacion.empresas e ON f.empresa_id = e.id
            LEFT JOIN sistema_facturacion.establecimientos es ON f.establecimiento_id = es.id
            LEFT JOIN sistema_facturacion.puntos_emision pe ON f.punto_emision_id = pe.id
            LEFT JOIN sistema_facturacion.usuarios u ON f.usuario_id = u.id
            LEFT JOIN sistema_facturacion.users usaut ON u.user_id = usaut.id
            LEFT JOIN sistema_facturacion.empresa_roles er ON u.empresa_rol_id = er.id
            WHERE f.snapshot_cliente IS NULL 
               OR f.snapshot_empresa IS NULL 
               OR f.snapshot_establecimiento IS NULL
               OR f.snapshot_punto_emision IS NULL
               OR f.snapshot_usuario IS NULL
               OR f.total_sin_impuestos IS NULL
               OR NOT (f.snapshot_usuario ? 'email');
        """
        cur.execute(query)
        rows = cur.fetchall()
        
        print(f"Encontradas {len(rows)} facturas que requieren reparación o actualización.")
        
        reparadas = 0
        for r in rows:
            updates = {}
            fid = r['id']
            
            # Reparar total_sin_impuestos
            if r['total_sin_impuestos'] is None:
                total = float(r['total'] or 0)
                iva = float(r['iva'] or 0)
                updates['total_sin_impuestos'] = total - iva
            
            # Reconstruir Snapshot Cliente
            if r['snapshot_cliente'] is None:
                updates['snapshot_cliente'] = json.dumps({
                    'identificacion': r['c_id'] or '9999999999999',
                    'tipo_identificacion': r['c_tipo'] or '07',
                    'razon_social': r['c_razon'] or 'CONSUMIDOR FINAL (RECUPERADO)',
                    'direccion': r['c_dir'] or 'CIUDAD',
                    'email': r['c_email'],
                    'snapshot_timestamp': datetime.now().isoformat()
                })

            # Reconstruir Snapshot Empresa
            if r['snapshot_empresa'] is None:
                updates['snapshot_empresa'] = json.dumps({
                    'ruc': r['e_ruc'] or '0000000000001',
                    'razon_social': r['e_razon'] or 'EMPRESA RECUPERADA',
                    'direccion': r['e_dir'] or 'DIRECCION MATRIZ',
                    'tipo_contribuyente': r['e_tipo'] or 'REGIMEN_GENERAL',
                    'obligado_contabilidad': r['e_obligado'] if r['e_obligado'] is not None else False,
                    'email': r['e_email'],
                    'snapshot_timestamp': datetime.now().isoformat()
                })

            # Reconstruir Snapshot Establecimiento
            if r['snapshot_establecimiento'] is None:
                updates['snapshot_establecimiento'] = json.dumps({
                    'codigo': r['es_codigo'] or '001',
                    'nombre': r['es_nombre'] or 'ESTABLECIMIENTO RECUPERADO',
                    'direccion': r['es_dir'] or r['e_dir'] or 'DIRECCION',
                    'snapshot_timestamp': datetime.now().isoformat()
                })

            # Reconstruir Snapshot Punto Emisión
            if r['snapshot_punto_emision'] is None:
                updates['snapshot_punto_emision'] = json.dumps({
                    'codigo': r['pe_codigo'] or '001',
                    'nombre': r['pe_nombre'] or 'CAJA RECUPERADA',
                    'snapshot_timestamp': datetime.now().isoformat()
                })

            # Reparar Snapshot Usuario (NUEVO: Validando email faltante)
            snapshot_u = r['snapshot_usuario']
            if snapshot_u is None or 'email' not in snapshot_u:
                # Si existe el snapshot pero le falta el email, intentamos mantener lo que tiene
                base_u = snapshot_u if isinstance(snapshot_u, dict) else {}
                
                new_snapshot_u = {
                    'nombres': r['u_nombres'] or base_u.get('nombres') or 'USUARIO',
                    'apellidos': r['u_apellidos'] or base_u.get('apellidos') or 'SISTEMA',
                    'email': r['u_email'] or base_u.get('email') or 'soporte@sistema.com',
                    'rol_codigo': r['u_rol_codigo'] or base_u.get('rol_codigo') or 'VENDEDOR',
                    'rol_nombre': r['u_rol_nombre'] or base_u.get('rol_nombre') or 'Vendedor',
                    'snapshot_timestamp': base_u.get('snapshot_timestamp') or datetime.now().isoformat()
                }
                updates['snapshot_usuario'] = json.dumps(new_snapshot_u)

            if updates:
                set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
                params = list(updates.values())
                params.append(fid)
                cur.execute(f"UPDATE sistema_facturacion.facturas SET {set_clause} WHERE id = %s", tuple(params))
                reparadas += 1

        conn.commit()
        print(f"Reparación completada. {reparadas} facturas actualizadas.")
        conn.close()
        
    except Exception as e:
        print(f"Error durante la reparación: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()

if __name__ == "__main__":
    fix_facturas()
