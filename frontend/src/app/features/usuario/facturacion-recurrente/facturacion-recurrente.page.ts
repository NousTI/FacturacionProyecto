import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';

@Component({
    selector: 'app-usuario-facturacion-recurrente',
    standalone: true,
    imports: [CommonModule, MaintenanceComponent],
    template: `
    <app-maintenance 
      moduleName="Facturación Recurrente" 
      description="Automatización de facturas periódicas y control de emisiones.">
    </app-maintenance>
  `
})
export class FacturacionRecurrentePage { }
