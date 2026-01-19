from fastapi import APIRouter, Depends
from services.dashboard_service import DashboardService
from dependencies.superadmin_dependencies import get_current_superadmin

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary", dependencies=[Depends(get_current_superadmin)])
def get_summary(service: DashboardService = Depends()):
    return service.get_summary()

@router.get("/charts", dependencies=[Depends(get_current_superadmin)])
def get_charts(service: DashboardService = Depends()):
    return service.get_charts()
