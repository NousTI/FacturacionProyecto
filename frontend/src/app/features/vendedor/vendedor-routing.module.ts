import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VendedorHomeComponent } from './home/vendedor-home.component';

const routes: Routes = [
    {
        path: '',
        component: VendedorHomeComponent
    },
    {
        path: 'empresas',
        loadComponent: () => import('./empresas/vendedor-empresas.page').then(m => m.VendedorEmpresasPage),
        data: { title: 'Empresas', description: 'Gestiona tu cartera de clientes y suscripciones' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VendedorRoutingModule { }
