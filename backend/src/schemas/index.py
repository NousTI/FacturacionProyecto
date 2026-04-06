# Punto de entrada global para los esquemas del sistema
# Esto permite importar desde un solo lugar para evitar importaciones circulares y mejorar la organización

from ..modules.usuarios.schemas import (
    UsuarioCreacion, UsuarioActualizacion, UsuarioLectura, 
    PerfilUsuarioLectura, UsuarioAdminLectura, CambioPassword
)

from ..modules.vendedores.schemas import (
    VendedorCreacion, VendedorActualizacion, VendedorLectura, 
    VendedorStats, VendedorHomeData
)

from ..modules.empresas.schemas import (
    EmpresaCreacion, EmpresaActualizacion, EmpresaLectura
)

from ..modules.sri.schemas import (
    ComprobanteSRI, RespuestaSRI, ValidacionRucCedula
)
