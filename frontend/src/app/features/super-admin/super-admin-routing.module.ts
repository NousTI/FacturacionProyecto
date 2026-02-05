import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmpresasPage } from './empresas/empresas.page';
import { VendedoresPage } from './vendedores/vendedores.page';
import { SuscripcionesPage } from './suscripciones/suscripciones.page';
import { ComisionesPage } from './comisiones/comisiones.page';
import { PlanesPage } from './planes/planes.page';
import { ClientesPage } from './clientes/clientes.page';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../domain/enums/role.enum';

const routes: Routes = [
    {
        path: 'empresas',
        component: EmpresasPage,
        canActivate: [RoleGuard],
        data: { title: 'Empresas', roles: [UserRole.SUPERADMIN], description: 'Empresas activas y suspendidas' }
    },
    {
        path: 'clientes',
        component: ClientesPage,
        canActivate: [RoleGuard],
        data: { title: 'Directorio Clientes', roles: [UserRole.SUPERADMIN], description: 'Usuarios de empresas y trazabilidad' }
    },
    {
        path: 'vendedores',
        component: VendedoresPage,
        canActivate: [RoleGuard],
        data: { title: 'Vendedores', roles: [UserRole.SUPERADMIN], description: 'Gestión de fuerza de ventas' }
    },
    {
        path: 'suscripciones',
        component: SuscripcionesPage,
        canActivate: [RoleGuard],
        data: { title: 'Suscripciones y Pagos', roles: [UserRole.SUPERADMIN], description: 'Planes activos y cobros' }
    },
    {
        path: 'comisiones',
        component: ComisionesPage,
        canActivate: [RoleGuard],
        data: { title: 'Comisiones', roles: [UserRole.SUPERADMIN], description: 'Cálculo y pagos pendientes' }
    },
    {
        path: 'certificados-sri',
        loadComponent: () => import('./certificados-sri/certificados-sri.page').then(m => m.CertificadosSriPage),
        canActivate: [RoleGuard],
        data: { title: 'Certificados SRI', roles: [UserRole.SUPERADMIN], permission: 'CONFIG_SRI' }
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'planes',
        component: PlanesPage,
        canActivate: [RoleGuard],
        data: { title: 'Planes y Límites', roles: [UserRole.SUPERADMIN], description: 'Configuración de paquetes' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SuperAdminRoutingModule { }
