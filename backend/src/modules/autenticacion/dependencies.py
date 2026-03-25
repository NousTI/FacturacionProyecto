from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from .services import AuthServices
from ...utils.jwt import decode_access_token
from ..suscripciones.repositories import RepositorioSuscripciones

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/autenticacion/iniciar-sesion")

async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    service: AuthServices = Depends()
):
    user = service.validar_token_y_obtener_usuario(token)
    request.state.jwt_payload = decode_access_token(token)
    return user

# Alias para compatibilidad
obtener_usuario_actual = get_current_user

from fastapi import HTTPException, status

def requerir_rol(rol: str):
    def rol_dependency(current_user: dict = Depends(get_current_user)):
        user_role = str(current_user.get("role") or current_user.get("rol") or "").upper()
        if user_role != rol.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requieren permisos de {rol}"
            )
        return current_user
    return rol_dependency

def requerir_superadmin(current_user: dict = Depends(get_current_user)):
    role = str(current_user.get("role") or current_user.get("rol") or "").upper()
    if role != "SUPERADMIN" and not current_user.get("is_superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de Super Administrador"
        )
    return current_user

requerir_admin = requerir_superadmin

import os
import json
from datetime import datetime, date

async def requerir_suscripcion_activa(
    current_user: dict = Depends(get_current_user),
    repo_suscripciones: RepositorioSuscripciones = Depends()
):
    """
    Verifica que la empresa del usuario tenga una suscripción activa.
    En caso de error, devuelve un JSON con el teléfono y mensaje de WhatsApp de contacto.
    """
    is_superadmin = current_user.get("role") == "SUPERADMIN" or current_user.get("is_superadmin")
    is_vendedor = current_user.get("role") == "VENDEDOR" or current_user.get("is_vendedor")
    
    if is_superadmin or is_vendedor:
        return current_user
        
    empresa_id = current_user.get("empresa_id")
    if not empresa_id:
        return current_user
        
    # 1. Consultar datos de empresa, vendedor y superadmin (para fallback dinámico)
    with repo_suscripciones.db.cursor() as cur:
        cur.execute("""
            SELECT e.ruc, e.razon_social, e.vendedor_id, v.telefono as vendedor_telefono, e.activo,
                   (SELECT u.telefono FROM sistema_facturacion.usuarios u 
                    JOIN sistema_facturacion.users us ON u.user_id = us.id 
                    WHERE us.role = 'SUPERADMIN' AND u.telefono IS NOT NULL LIMIT 1) as admin_telefono
            FROM sistema_facturacion.empresas e
            LEFT JOIN sistema_facturacion.vendedores v ON e.vendedor_id = v.id
            WHERE e.id = %s
        """, (str(empresa_id),))
        e = cur.fetchone()
    
    if not e:
        return current_user

    # 2. Configuración de contacto
    ruc = e['ruc']
    nombre = e['razon_social']
    vendedor_phone = e['vendedor_telefono']
    superadmin_phone = e['admin_telefono'] or "593900000000"
    
    # 3. Caso: Empresa Inhabilitada (403)
    if not e['activo']:
        res = {
            "type": "COMPANY_DISABLED",
            "phone": superadmin_phone,
            "message": f"Hola, soy {nombre} (RUC: {ruc}). Mi cuenta de empresa aparece inhabilitada. Por favor, desearía saber el motivo y los pasos para reactivarla."
        }
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=json.dumps(res))

    # 4. Caso: Suscripción (402)
    suscripcion = repo_suscripciones.obtener_suscripcion_por_empresa(empresa_id)
    estado = suscripcion['estado'] if suscripcion else 'INEXISTENTE'
    
    fecha_fin_raw = suscripcion['fecha_fin'] if suscripcion else None
    if hasattr(fecha_fin_raw, 'date'):
        fecha_fin_raw = fecha_fin_raw.date()
        
    vencida = (fecha_fin_raw < date.today()) if fecha_fin_raw else True
    
    if estado != 'ACTIVA' or vencida:
        # Lógica de 5 días para cambio de contacto (Vendedor vs Superadmin)
        target_phone = vendedor_phone if vendedor_phone else superadmin_phone
        fecha_fin = suscripcion['fecha_fin'] if suscripcion else date.today()
        
        if isinstance(fecha_fin, datetime):
            fecha_fin = fecha_fin.date()
            
        days_diff = (date.today() - fecha_fin).days
        if days_diff > 5:
            target_phone = superadmin_phone
            
        res = {
            "type": f"SUBSCRIPTION_{estado}",
            "phone": target_phone,
            "message": f"Hola, mi nombre es {nombre} (RUC: {ruc}). Mi suscripción venció el {fecha_fin} y deseo renovar mi plan. Por favor, ayúdeme con la información para el pago."
        }
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=json.dumps(res))
        
    return current_user
