import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardHomePage } from './pages/home/dashboard-home.page';
import { ProfilePage } from './pages/profile/profile.page';
import { MaintenanceComponent } from '../../shared/components/maintenance/maintenance.component';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../domain/enums/role.enum';

const routes: Routes = [
    {
        path: '',
        component: DashboardHomePage,
        canActivate: [RoleGuard],
        data: { title: 'Dashboard', roles: [UserRole.SUPERADMIN], description: 'Vista general del sistema' }
    },
    { path: 'perfil', component: ProfilePage, data: { title: 'Perfil', description: 'Gestiona tu cuenta' } },
    { path: 'facturas', component: MaintenanceComponent, data: { title: 'Facturación', description: 'Emisión y control de facturas' } },
    { path: 'clientes', component: MaintenanceComponent, data: { title: 'Clientes', description: 'Listado de clientes registrados' } },
    { path: 'productos', component: MaintenanceComponent, data: { title: 'Productos', description: 'Gestión de productos y servicios' } },
    { path: 'empresas', component: MaintenanceComponent, data: { title: 'Empresas', description: 'Empresas activas y suspendidas' } },
    { path: 'suscripciones', component: MaintenanceComponent, data: { title: 'Suscripciones y Pagos', description: 'Planes activos y cobros' } },
    { path: 'finanzas', component: MaintenanceComponent, data: { title: 'Finanzas', description: 'Estado financiero global' } },
    { path: 'vendedores', component: MaintenanceComponent, data: { title: 'Vendedores', description: 'Gestión de fuerza de ventas' } },
    { path: 'comisiones', component: MaintenanceComponent, data: { title: 'Comisiones', description: 'Cálculo y pagos pendientes' } },
    { path: 'planes', component: MaintenanceComponent, data: { title: 'Planes', description: 'Configuración de paquetes' } },
    { path: 'certificados', component: MaintenanceComponent, data: { title: 'Certificados SRI', description: 'Vencimientos y renovaciones' } },
    { path: 'reportes', component: MaintenanceComponent, data: { title: 'Reportes', description: 'Analítica y estadísticas' } },
    { path: 'auditoria', component: MaintenanceComponent, data: { title: 'Auditoría', description: 'Registros de actividad' } },
    { path: 'soporte', component: MaintenanceComponent, data: { title: 'Soporte', description: 'Tickets de ayuda' } },
    { path: 'config', component: MaintenanceComponent, data: { title: 'Configuración', description: 'Ajustes del sistema' } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule { }
