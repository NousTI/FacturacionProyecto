import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';

@Component({
    selector: 'app-usuario-dashboard',
    standalone: true,
    imports: [CommonModule, MaintenanceComponent],
    template: `
    <app-maintenance 
      moduleName="Dashboard" 
      description="Resumen personal: Facturas emitidas, alertas y accesos rápidos.">
    </app-maintenance>
  `
})
export class DashboardComponent { }
