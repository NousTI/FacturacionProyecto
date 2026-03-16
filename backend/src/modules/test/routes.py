from fastapi import APIRouter, Depends
from .controller import TestController
from .schemas import TestResponse

router = APIRouter()

@router.get("/", response_model=TestResponse)
def listar_test(controller: TestController = Depends()):
    """Endpoint para listar datos de mockup del modulo test"""
    return controller.listar_items()

@router.get("/health")
def health_check():
    return {"status": "ok", "module": "test_mockup"}
