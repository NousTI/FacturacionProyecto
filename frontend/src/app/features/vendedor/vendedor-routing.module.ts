import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MaintenanceComponent } from '../../shared/components/maintenance/maintenance.component';

const routes: Routes = [
    {
        path: '',
        component: MaintenanceComponent,
        data: { title: 'Dahsboard Vendedor', description: 'Próximamente' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VendedorRoutingModule { }
