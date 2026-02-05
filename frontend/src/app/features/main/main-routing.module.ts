import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardHomePage } from '../super-admin/home/dashboard-home.page';
import { MaintenanceComponent } from '../../shared/components/maintenance/maintenance.component';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../domain/enums/role.enum';

const routes: Routes = [
    {
        path: '',
        component: DashboardHomePage,
        canActivate: [RoleGuard],
        data: { title: 'Inicio', roles: [UserRole.SUPERADMIN, UserRole.VENDEDOR, UserRole.USUARIO], description: 'Vista general del sistema' }
    },
    // Role-based modules
    {
        path: '',
        loadChildren: () => import('../super-admin/super-admin.module').then(m => m.SuperAdminModule),
        canActivate: [RoleGuard],
        data: { roles: [UserRole.SUPERADMIN] }
    },
    {
        path: 'vendedor-portal',
        loadChildren: () => import('../vendedor/vendedor.module').then(m => m.VendedorModule),
        canActivate: [RoleGuard],
        data: { roles: [UserRole.VENDEDOR] }
    },
    // Shared / Global Maintenance routes
    { path: 'finanzas', component: MaintenanceComponent, data: { title: 'Finanzas', description: 'Estado financiero global' } },
    { path: 'reportes', component: MaintenanceComponent, data: { title: 'Reportes', description: 'Analítica y estadísticas' } },
    { path: 'auditoria', component: MaintenanceComponent, data: { title: 'Auditoría', description: 'Registros de actividad' } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MainRoutingModule { }
