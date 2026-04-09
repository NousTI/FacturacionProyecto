import sys
import os
from uuid import uuid4
from decimal import Decimal
from datetime import datetime

# Add the root directory (parent of src) to sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(root_dir)

# Now import using the full package path starting from 'src'
import src.modules.empresas.schemas as empresas_schemas
import src.modules.suscripciones.schemas as susc_schemas
from src.modules.empresas.controller import EmpresaController
from src.modules.empresas.services import ServicioEmpresas
from src.modules.suscripciones.services import ServicioSuscripciones
from src.modules.suscripciones.repositories import RepositorioSuscripciones
from src.modules.empresas.repositories import RepositorioEmpresas
from src.modules.vendedores.repositories import RepositorioVendedores
from src.modules.empresa_roles.services import ServicioRoles
from src.modules.logs.service import ServicioLogs
from src.database.session import get_db

def test_logic_directly():
    db = next(get_db())
    
    # 1. Setup services
    repo_susc = RepositorioSuscripciones(db)
    repo_emp = RepositorioEmpresas(db)
    repo_vend = RepositorioVendedores(db)
    
    # We need real instances or mocks that don't fail
    from src.modules.logs.repositories import RepositorioLogs
    repo_logs = RepositorioLogs(db)
    logs_service = ServicioLogs(repo=repo_logs)
    
    from src.modules.empresa_roles.repositories import RepositorioRoles
    repo_roles = RepositorioRoles(db)
    roles_service = ServicioRoles(repo=repo_roles)
    
    servicio_emp = ServicioEmpresas(repo=repo_emp, vendedor_repo=repo_vend, roles_service=roles_service, logs_service=logs_service)
    servicio_susc = ServicioSuscripciones(repo=repo_susc, empresa_repo=repo_emp)
    
    controller = EmpresaController(service=servicio_emp, suscripcion_service=servicio_susc)

    # 2. Get a plan with price 0
    planes = repo_susc.listar_planes()
    plan_basico = next((p for p in planes if p['precio_anual'] == 0), None)
    
    if not plan_basico:
        print("No se encontró un plan básico ($0) para probar.")
        return

    print(f"Usando plan básico: {plan_basico['nombre']} ({plan_basico['id']})")

    # 3. Request Data
    # Generate a valid RUC (13 digits)
    import random
    unique_ruc = "".join([str(random.randint(0, 9)) for _ in range(10)]) + "001"
    
    # Manually creating the schema instance
    body = empresas_schemas.EmpresaCreacion(
        ruc=unique_ruc,
        razon_social="Empresa Test Logic FINAL",
        nombre_comercial="Test Logic FINAL",
        email="test_final@empresa.com",
        direccion="Av. Logic 123",
        tipo_contribuyente="PERSONA_JURIDICA",
        plan_id=plan_basico['id'],
        monto_pago=Decimal('0.00'),
        observacion_pago="Suscripción de prueba lógica final"
    )

    # Need a real superadmin user ID from the database if possible, 
    # but here we use a fake one and hope the service doesn't validate existence in DB table (just in dict)
    mock_user = {
        "id": "00000000-0000-0000-0000-000000000000", 
        "email": "admin@test.com",
        "is_superadmin": True,
        "is_vendedor": False,
        "is_usuario": False
    }

    print(f"Llamando a controller.crear_empresa con RUC: {unique_ruc}")
    try:
        response = controller.crear_empresa(body, mock_user)
        data = response.get('detalles', {})
        empresa_id = data.get('id')
        print(f"Resultado: {response.get('mensaje')}")
        print(f"Plan en respuesta: {data.get('plan_nombre')} (ID: {data.get('current_plan_id')})")
        
        if not empresa_id:
            print("ERROR: No se obtuvo ID de empresa en la respuesta.")
            return

        # Verify
        suscripcion = repo_susc.obtener_suscripcion_por_empresa(empresa_id)
        if suscripcion and str(suscripcion['plan_id']) == str(plan_basico['id']):
            print(f"ÉXITO: Suscripción creada correctamente para el plan {plan_basico['nombre']}")
        else:
            print(f"FALLA: Suscripción no encontrada o plan incorrecto. Susc: {suscripcion}")
            
        pagos = repo_susc.listar_pagos(empresa_id=empresa_id)
        if pagos:
            print(f"ÉXITO: Pago inicial registrado. Monto: {pagos[0]['monto']}")
        else:
            print("FALLA: Pago no encontrado.")
            
    except Exception as e:
        print(f"ERROR durante la ejecución: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_logic_directly()
