import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VendedorHomeComponent } from './dashboard/vendedor-home.component';
import { RenovacionesVendedorPage } from './renovaciones/renovaciones-vendedor.page';
import { VendedorActivoGuard } from './guards/vendedor-activo.guard';
import { VendedorBloqueadoComponent } from './bloqueado/vendedor-bloqueado.component';

const routes: Routes = [
    {
        path: 'bloqueado',
        component: VendedorBloqueadoComponent
    },
    {
        path: '',
        component: VendedorHomeComponent,
        canActivate: [VendedorActivoGuard],
        canActivateChild: [VendedorActivoGuard]
    },
    {
        path: 'empresas',
        loadComponent: () => import('./empresas/vendedor-empresas.page').then(m => m.VendedorEmpresasPage),
        data: { title: 'Empresas', description: 'Gestiona tu cartera de clientes y suscripciones' },
        canActivate: [VendedorActivoGuard]
    },
    {
        path: 'suscripciones',
        loadComponent: () => import('./suscripciones/vendedor-suscripciones.page').then(m => m.VendedorSuscripcionesPage),
        data: { title: 'Suscripciones y Pagos', description: 'Historial de pagos y estado de suscripciones' },
        canActivate: [VendedorActivoGuard]
    },
    {
        path: 'comisiones',
        loadComponent: () => import('./comisiones/vendedor-comisiones.page').then(m => m.VendedorComisionesPage),
        data: { title: 'Comisiones', description: 'Historial de ganancias y comisiones' },
        canActivate: [VendedorActivoGuard]
    },
    {
        path: 'planes',
        loadComponent: () => import('./planes/vendedor-planes.page').then(m => m.VendedorPlanesPage),
        data: { title: 'Planes y Límites', description: 'Catálogo de servicios y límites corporativos' },
        canActivate: [VendedorActivoGuard]
    },
    {
        path: 'clientes',
        loadComponent: () => import('./clientes/vendedor-clientes.page').then(m => m.VendedorClientesPage),
        data: { title: 'Clientes', description: 'Gestión de usuarios de tus empresas' },
        canActivate: [VendedorActivoGuard]
    },
    {
        path: 'perfil',
        loadComponent: () => import('./perfil/perfil.page').then(m => m.VendedorPerfilPage),
        data: { title: 'Mi Perfil', description: 'Información personal y opciones de cuenta' },
        canActivate: [VendedorActivoGuard]
    },
    {
        path: 'reportes',
        loadComponent: () => import('./reportes/vendedor-reportes.page').then(m => m.VendedorReportesPage),
        data: { title: 'Reportes', description: 'Dashboard y generación de archivos' },
        canActivate: [VendedorActivoGuard]
    },
    {
        path: 'renovaciones',
        component: RenovacionesVendedorPage,
        data: { title: 'Seguimiento de Renovaciones', description: 'Empresas en proceso de renovación' },
        canActivate: [VendedorActivoGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VendedorRoutingModule { }
