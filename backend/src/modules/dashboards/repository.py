from fastapi import Depends
from ...database.session import get_db

from .repositories.kpi_repository import KpiRepository
from .repositories.chart_repository import ChartRepository
from .repositories.alert_repository import AlertRepository
from .repositories.admin_repository import AdminRepository
from .repositories.empresa_repository import EmpresaRepository

class RepositorioDashboards(
    KpiRepository, 
    ChartRepository, 
    AlertRepository, 
    AdminRepository, 
    EmpresaRepository
):
    """
    Repositorio principal para el módulo de dashboards.
    Hereda de sub-repositorios especializados para mantener un código limpio y modular.
    """
    def __init__(self, db=Depends(get_db)):
        super().__init__(db=db)
