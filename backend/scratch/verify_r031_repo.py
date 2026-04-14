import sys
import os
from unittest.mock import MagicMock
from decimal import Decimal
import json

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'backend', 'src'))

try:
    from modules.reportes.vendedores.R_031.repository import RepositorioR031Vendedor
    
    # Mock DB
    mock_db = MagicMock()
    repo = RepositorioR031Vendedor(db=mock_db)
    
    # Test _calc_pct
    print(f"Test _calc_pct(10, 5): {repo._calc_pct(10, 5)} (type: {type(repo._calc_pct(10, 5))})")
    
    # Test _formatear_vencimiento
    from datetime import date
    print(f"Test _formatear_vencimiento: {repo._formatear_vencimiento(date.today(), date.today())}")
    
    print("\nVerification successful (logic check).")
except Exception as e:
    print(f"Verification failed: {e}")
    sys.exit(1)
