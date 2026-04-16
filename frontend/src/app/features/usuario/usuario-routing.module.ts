import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilePage } from './profile/profile.page';
import { RoleGuard } from '../../core/guards/role.guard';
import { permissionGuard } from '../../core/guards/permission.guard';
import { UserRole } from '../../domain/enums/role.enum';
import { SinPermisosPage } from './sin-permisos/sin-permisos.page';

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

import { UsuariosPage } from './usuarios/usuarios.page';
import { CertificadoSriPage } from './certificado-sri/certificado-sri.page';
import { EmpresaPage } from './empresa/empresa.page';
import { RolesPermisosPage } from './roles/roles.page';
import { ProveedoresPage } from './proveedores/proveedores.page';
import { GastosPage } from './gastos/gastos.page';
import { ConfiguracionPage } from './configuracion/configuracion.page';
import { AccesoRestringidoPage } from './acceso-restringido/acceso-restringido.page';

import { CompanyActiveGuard } from '../../core/guards/company-active.guard';
import { lockActiveGuard } from '../../core/guards/lock-active.guard';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'sin-permisos',
        component: SinPermisosPage
    },
    {
        path: 'dashboard',
        component: DashboardPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Dashboard', roles: [UserRole.USUARIO], permission: 'DASHBOARD_VER' }
    },
    {
        path: 'roles',
        component: RolesPermisosPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Roles y Permisos', roles: [UserRole.USUARIO], permission: 'ROLES_VER' }
    },
    {
        path: 'empresa',
        component: EmpresaPage,
        canActivate: [RoleGuard, permissionGuard],
        data: { title: 'Empresa', roles: [UserRole.USUARIO], permission: 'CONFIG_EMPRESA' }
    },
    {
        path: 'usuarios',
        component: UsuariosPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Usuarios', roles: [UserRole.USUARIO], permission: 'USUARIOS_VER' }
    },
    {
        path: 'clientes',
        component: ClientesPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Clientes', roles: [UserRole.USUARIO, UserRole.VENDEDOR], permission: 'CLIENTES_VER' }
    },
    {
        path: 'proveedores',
        component: ProveedoresPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Proveedores', roles: [UserRole.USUARIO], permission: 'PROVEEDOR_VER' }
    },
    {
        path: 'productos',
        component: ProductosPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Productos', roles: [UserRole.USUARIO], permission: 'PRODUCTOS_VER' }
    },
    {
        path: 'facturacion',
        component: FacturacionPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Facturación', roles: [UserRole.USUARIO], permission: ['FACTURAS_VER_TODAS', 'FACTURAS_VER_PROPIAS'] }
    },
    {
        path: 'cuentas-cobrar',
        component: CuentasCobrarPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Cuentas por Cobrar', roles: [UserRole.USUARIO], permission: 'CUENTA_COBRAR_VER' }
    },
    {
        path: 'facturacion-recurrente',
        component: FacturacionRecurrentePage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Facturación Programada', roles: [UserRole.USUARIO], permission: ['FACTURA_PROGRAMADA_VER', 'FACTURA_PROGRAMADA_VER_PROPIAS'] }
    },
    {
        path: 'reportes',
        component: ReportesPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Reportes', roles: [UserRole.USUARIO], permission: 'REPORTES_VER' }
    },
    {
        path: 'establecimientos',
        component: EstablecimientosPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Establecimientos', roles: [UserRole.USUARIO], permission: ['ESTABLECIMIENTO_GESTIONAR'] }
    },
    {
        path: 'puntos-emision',
        component: PuntosEmisionPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Puntos de Emisión', roles: [UserRole.USUARIO], permission: ['PUNTO_EMISION_GESTIONAR'] }
    },
    {
        path: 'configuracion',
        component: ConfiguracionPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Configuración', roles: [UserRole.USUARIO], permission: ['CONFIG_SRI', 'CONFIG_EMPRESA', 'CONFIG_ROLES', 'ESTABLECIMIENTO_GESTIONAR', 'PUNTO_EMISION_GESTIONAR'] }
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
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Certificado SRI', roles: [UserRole.USUARIO], permission: 'CONFIG_SRI' }
    },
    {
        path: 'gastos',
        component: GastosPage,
        canActivate: [RoleGuard, CompanyActiveGuard, permissionGuard],
        data: { title: 'Gastos y Egresos', roles: [UserRole.USUARIO], permission: ['GESTIONAR_GASTOS', 'GESTIONAR_PAGOS', 'GESTIONAR_CATEGORIA_GASTO'] }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UsuarioRoutingModule { }
