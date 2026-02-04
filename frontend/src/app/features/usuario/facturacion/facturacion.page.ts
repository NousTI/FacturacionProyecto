import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';

@Component({
    selector: 'app-usuario-facturacion',
    standalone: true,
    imports: [CommonModule, MaintenanceComponent],
    template: `
    <app-maintenance 
      moduleName="Facturación" 
      description="Emisión de facturas, anulación y envío al SRI.">
    </app-maintenance>
  `
})
export class FacturacionPage { }
