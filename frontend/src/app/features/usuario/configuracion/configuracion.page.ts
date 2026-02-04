import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';

@Component({
    selector: 'app-usuario-configuracion',
    standalone: true,
    imports: [CommonModule, MaintenanceComponent],
    template: `
    <app-maintenance 
      moduleName="Configuración" 
      description="Ajustes de cuenta, seguridad y preferencias del sistema.">
    </app-maintenance>
  `
})
export class ConfiguracionPage { }
