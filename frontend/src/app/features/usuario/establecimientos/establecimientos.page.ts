import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';

@Component({
    selector: 'app-usuario-establecimientos',
    standalone: true,
    imports: [CommonModule, MaintenanceComponent],
    template: `
    <app-maintenance 
      moduleName="Establecimientos" 
      description="Gestión de establecimientos y puntos de emisión.">
    </app-maintenance>
  `
})
export class EstablecimientosPage { }
