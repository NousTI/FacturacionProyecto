import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';

@Component({
    selector: 'app-usuario-reportes',
    standalone: true,
    imports: [CommonModule, MaintenanceComponent],
    template: `
    <app-maintenance 
      moduleName="Reportes" 
      description="Visualización y exportación de reportes de ventas, facturas y clientes.">
    </app-maintenance>
  `
})
export class ReportesPage { }
