import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilePage } from './profile/profile.page';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../domain/enums/role.enum';

// New Component Imports
import { DashboardPage } from './dashboard/dashboard.page';
import { ClientesPage } from './clientes/clientes.page';
import { ProductosPage } from './productos/productos.page';
import { FacturacionPage } from './facturacion/facturacion.page';
import { FacturacionRecurrentePage } from './facturacion-recurrente/facturacion-recurrente.page';
import { ReportesPage } from './reportes/reportes.page';
import { EstablecimientosPage } from './establecimientos/establecimientos.page';
import { PuntosEmisionPage } from './puntos-emision/puntos-emision.page';
import { CuentasCobrarPage } from './cuentas-cobrar/cuentas-cobrar.page';
import { CuentasPagarPage } from './cuentas-pagar/cuentas-pagar.page';

import { UsuariosPage } from './usuarios/usuarios.page';
import { CertificadoSriPage } from './certificado-sri/certificado-sri.page';
import { EmpresaPage } from './empresa/empresa.page';
import { RolesPermisosPage } from './roles/roles.page';
import { ProveedoresPage } from './proveedores/proveedores.page';
import { GastosPage } from './gastos/gastos.page';
import { InventariosPage } from './inventarios/inventarios.page';

import { CompanyActiveGuard } from '../../core/guards/company-active.guard';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        component: DashboardPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Dashboard', roles: [UserRole.USUARIO] }
    },
    {
        path: 'roles',
        component: RolesPermisosPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Roles y Permisos', roles: [UserRole.USUARIO], permission: 'CONFIG_ROLES' }
    },
    {
        path: 'empresa',
        component: EmpresaPage,
        canActivate: [RoleGuard],
        data: { title: 'Empresa', roles: [UserRole.USUARIO], permission: 'CONFIG_EMPRESA' }
    },
    {
        path: 'usuarios',
        component: UsuariosPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Usuarios', roles: [UserRole.USUARIO], permission: 'CONFIG_USUARIOS' }
    },
    {
        path: 'clientes',
        component: ClientesPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Clientes', roles: [UserRole.USUARIO, UserRole.VENDEDOR], permission: 'CLIENTES_VER' }
    },
    {
        path: 'proveedores',
        component: ProveedoresPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Proveedores', roles: [UserRole.USUARIO], permission: 'PROVEEDOR_VER' }
    },
    {
        path: 'productos',
        component: ProductosPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Productos', roles: [UserRole.USUARIO], permission: 'PRODUCTOS_VER' }
    },
    {
        path: 'facturacion',
        component: FacturacionPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Facturación', roles: [UserRole.USUARIO], permission: ['FACTURAS_VER_TODAS', 'FACTURAS_VER_PROPIAS', 'FACTURAS_CREAR'] }
    },
    {
        path: 'cuentas-cobrar',
        component: CuentasCobrarPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Cuentas por Cobrar', roles: [UserRole.USUARIO], permission: 'CUENTA_COBRAR_VER' }
    },
    /* {
        path: 'cuentas-pagar',
        component: CuentasPagarPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Cuentas por Pagar', roles: [UserRole.USUARIO], permission: 'CUENTA_PAGAR_VER' }
    }, */
    {
        path: 'facturacion-recurrente',
        component: FacturacionRecurrentePage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Facturación Recurrente', roles: [UserRole.USUARIO], permission: 'FACTURA_PROGRAMADA_VER' }
    },
    {
        path: 'reportes',
        component: ReportesPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Reportes', roles: [UserRole.USUARIO], permission: ['REPORTES_VER', 'REPORTES_EXPORTAR'] }
    },
    {
        path: 'establecimientos',
        component: EstablecimientosPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Establecimientos', roles: [UserRole.USUARIO], permission: 'CONFIG_ESTABLECIMIENTOS' }
    },
    {
        path: 'puntos-emision',
        component: PuntosEmisionPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Puntos de Emisión', roles: [UserRole.USUARIO], permission: 'CONFIG_ESTABLECIMIENTOS' }
    },
    {
        path: 'perfil',
        component: ProfilePage,
        canActivate: [RoleGuard],
        data: { title: 'Perfil', roles: [UserRole.USUARIO] }
    },
    {
        path: 'certificado-sri',
        component: CertificadoSriPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Certificado SRI', roles: [UserRole.USUARIO], permission: 'CONFIG_SRI' }
    },
    {
        path: 'gastos',
        component: GastosPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Gastos y Egresos', roles: [UserRole.USUARIO], permission: ['GASTOS_VER', 'CATEGORIA_GASTO_VER', 'PAGO_GASTO_VER'] }
    },
    {
        path: 'inventarios',
        component: InventariosPage,
        canActivate: [RoleGuard, CompanyActiveGuard],
        data: { title: 'Inventarios', roles: [UserRole.USUARIO], permission: 'INVENTARIO_VER' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UsuarioRoutingModule { }
