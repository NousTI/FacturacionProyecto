import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VendedorHomeComponent } from './dashboard/vendedor-home.component';

const routes: Routes = [
    {
        path: '',
        component: VendedorHomeComponent
    },
    {
        path: 'empresas',
        loadComponent: () => import('./empresas/vendedor-empresas.page').then(m => m.VendedorEmpresasPage),
        data: { title: 'Empresas', description: 'Gestiona tu cartera de clientes y suscripciones' }
    },
    {
        path: 'pagos',
        loadComponent: () => import('./suscripciones/vendedor-suscripciones.page').then(m => m.VendedorSuscripcionesPage),
        data: { title: 'Suscripciones y Pagos', description: 'Historial de pagos y estado de suscripciones' }
    },
    {
        path: 'comisiones',
        loadComponent: () => import('./comisiones/vendedor-comisiones.page').then(m => m.VendedorComisionesPage),
        data: { title: 'Comisiones', description: 'Historial de ganancias y comisiones' }
    },
    {
        path: 'planes',
        loadComponent: () => import('./planes/vendedor-planes.page').then(m => m.VendedorPlanesPage),
        data: { title: 'Planes y Límites', description: 'Catálogo de servicios y límites corporativos' }
    },
    {
        path: 'clientes',
        loadComponent: () => import('./clientes/vendedor-clientes.page').then(m => m.VendedorClientesPage),
        data: { title: 'Clientes', description: 'Gestión de usuarios de tus empresas' }
    },
    {
        path: 'perfil',
        loadComponent: () => import('./perfil/perfil.page').then(m => m.VendedorPerfilPage),
        data: { title: 'Mi Perfil', description: 'Información personal y opciones de cuenta' }
    },
    {
        path: 'reportes',
        loadComponent: () => import('./reportes/vendedor-reportes.page').then(m => m.VendedorReportesPage),
        data: { title: 'Reportes', description: 'Dashboard y generación de archivos' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VendedorRoutingModule { }
