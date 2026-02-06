import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilePage } from './profile/profile.page';
import { MaintenanceComponent } from '../../shared/components/maintenance/maintenance.component';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../domain/enums/role.enum';

// New Component Imports
import { DashboardComponent } from './dashboard/dashboard.component';
import { ClientesPage } from './clientes/clientes.page';
import { ProductosPage } from './productos/productos.page';
import { FacturacionPage } from './facturacion/facturacion.page';
import { FacturacionRecurrentePage } from './facturacion-recurrente/facturacion-recurrente.page';
import { ReportesPage } from './reportes/reportes.page';
import { EstablecimientosPage } from './establecimientos/establecimientos.page';
import { PuntosEmisionPage } from './puntos-emision/puntos-emision.page';
import { ConfiguracionPage } from './configuracion/configuracion.page';
import { UsuariosPage } from './usuarios/usuarios.page';
import { CertificadoSriPage } from './certificado-sri/certificado-sri.page';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [RoleGuard],
        data: { title: 'Dashboard', roles: [UserRole.USUARIO] }
    },
    {
        path: 'usuarios',
        component: UsuariosPage,
        canActivate: [RoleGuard],
        data: { title: 'Usuarios', roles: [UserRole.USUARIO] }
    },
    {
        path: 'clientes',
        component: ClientesPage,
        canActivate: [RoleGuard],
        data: { title: 'Clientes', roles: [UserRole.USUARIO, UserRole.VENDEDOR] }
    },
    {
        path: 'productos',
        component: ProductosPage,
        canActivate: [RoleGuard],
        data: { title: 'Productos', roles: [UserRole.USUARIO] }
    },
    {
        path: 'facturacion',
        component: FacturacionPage,
        canActivate: [RoleGuard],
        data: { title: 'Facturación', roles: [UserRole.USUARIO] }
    },
    {
        path: 'facturacion-recurrente',
        component: FacturacionRecurrentePage,
        canActivate: [RoleGuard],
        data: { title: 'Facturación Recurrente', roles: [UserRole.USUARIO] }
    },
    {
        path: 'reportes',
        component: ReportesPage,
        canActivate: [RoleGuard],
        data: { title: 'Reportes', roles: [UserRole.USUARIO] }
    },
    {
        path: 'establecimientos',
        component: EstablecimientosPage,
        canActivate: [RoleGuard],
        data: { title: 'Establecimientos', roles: [UserRole.USUARIO] }
    },
    {
        path: 'puntos-emision',
        component: PuntosEmisionPage,
        canActivate: [RoleGuard],
        data: { title: 'Puntos de Emisión', roles: [UserRole.USUARIO] }
    },
    {
        path: 'configuracion',
        component: ConfiguracionPage,
        canActivate: [RoleGuard],
        data: { title: 'Configuración', roles: [UserRole.USUARIO] }
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
        canActivate: [RoleGuard],
        data: { title: 'Certificado SRI', roles: [UserRole.USUARIO], permission: 'CONFIG_SRI' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UsuarioRoutingModule { }
