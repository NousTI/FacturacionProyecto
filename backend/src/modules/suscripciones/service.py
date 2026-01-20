from fastapi import Depends
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional

from .repository import RepositorioSuscripciones
from .schemas import PlanCreacion, PagoSuscripcionCreacion, PagoSuscripcionQuick
from ..comisiones.service import ServicioComisiones
from ..modulos.service import ServicioModulos
from ..empresa.repository import RepositorioEmpresa
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioSuscripciones:
    def __init__(
        self,
        repo: RepositorioSuscripciones = Depends(),
        comision_service: ServicioComisiones = Depends(),
        modulo_service: ServicioModulos = Depends(),
        empresa_repo: RepositorioEmpresa = Depends()
    ):
        self.repo = repo
        self.comision_service = comision_service
        self.modulo_service = modulo_service
        self.empresa_repo = empresa_repo

    def listar_planes(self):
        return self.repo.listar_planes()

    def registrar_pago_rapido(self, data: PagoSuscripcionQuick, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo superadmin", 403, "AUTH_FORBIDDEN")
            
        plan = self.repo.obtener_plan_por_id(data.plan_id)
        empresa = self.empresa_repo.obtener_por_id(data.empresa_id)
        
        monto = data.monto or plan['precio_mensual']
        fecha_inicio = data.fecha_inicio_periodo or datetime.now()
        fecha_fin = data.fecha_fin_periodo or (fecha_inicio + timedelta(days=30))
        
        pago_dict = {
            "empresa_id": data.empresa_id,
            "plan_id": data.plan_id,
            "monto": monto,
            "fecha_pago": datetime.now(),
            "fecha_inicio_periodo": fecha_inicio,
            "fecha_fin_periodo": fecha_fin,
            "metodo_pago": data.metodo_pago,
            "estado": "COMPLETED",
            "numero_comprobante": data.numero_comprobante,
            "registrado_por": usuario_actual['id']
        }
        
        empresa_data = {
            "id": data.empresa_id,
            "fecha_activacion": fecha_inicio,
            "fecha_vencimiento": fecha_fin,
            "estado": "ACTIVA"
        }
        
        comision = self.comision_service.calcular_comision_potencial(data.empresa_id, float(monto))
        
        pago_id = self.repo.registrar_suscripcion_atomica(pago_dict, empresa_data, comision)
        
        # Sincronizar módulos
        self.modulo_service.sincronizar(data.empresa_id, data.plan_id, fecha_fin)
        
        return {"id": pago_id, "mensaje": "Pago registrado y suscripción activada"}

    def listar_pagos(self, usuario_actual: dict):
        empresa_id = None if usuario_actual.get(AuthKeys.IS_SUPERADMIN) else usuario_actual.get('empresa_id')
        return self.repo.listar_pagos(empresa_id)
