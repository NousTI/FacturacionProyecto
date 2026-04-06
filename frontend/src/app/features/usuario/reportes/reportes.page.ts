import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';

@Component({
    selector: 'app-usuario-reportes',
    standalone: true,
    imports: [CommonModule, MaintenanceComponent],
    template: `
    <app-maintenance 
      moduleName="Reportes Financieros" 
      description="Herramientas avanzadas de análisis, exportación de datos y reportes personalizados.">
    </app-maintenance>
  `
})
export class ReportesPage { }
