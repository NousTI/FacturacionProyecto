import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilePage } from './profile/profile.page';
import { MaintenanceComponent } from '../../shared/components/maintenance/maintenance.component';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../domain/enums/role.enum';

const routes: Routes = [
    {
        path: 'perfil',
        component: ProfilePage,
        data: { title: 'Perfil', description: 'Gestiona tu cuenta' }
    },
    {
        path: 'facturas',
        component: MaintenanceComponent,
        canActivate: [RoleGuard],
        data: { title: 'Facturación', roles: [UserRole.USUARIO], description: 'Emisión y control de facturas' }
    },
    {
        path: 'clientes',
        component: MaintenanceComponent,
        canActivate: [RoleGuard],
        data: { title: 'Clientes', roles: [UserRole.USUARIO, UserRole.VENDEDOR], description: 'Listado de clientes registrados' }
    },
    {
        path: 'productos',
        component: MaintenanceComponent,
        canActivate: [RoleGuard],
        data: { title: 'Productos', roles: [UserRole.USUARIO], description: 'Gestión de productos y servicios' }
    },
    {
        path: 'certificados',
        component: MaintenanceComponent,
        canActivate: [RoleGuard],
        data: { title: 'Certificados SRI', roles: [UserRole.USUARIO], description: 'Vencimientos y renovaciones' }
    },
    {
        path: 'config',
        component: MaintenanceComponent,
        canActivate: [RoleGuard],
        data: { title: 'Configuración', roles: [UserRole.USUARIO], description: 'Ajustes del sistema' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UsuarioRoutingModule { }
