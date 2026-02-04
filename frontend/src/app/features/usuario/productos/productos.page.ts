import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';

@Component({
    selector: 'app-usuario-productos',
    standalone: true,
    imports: [CommonModule, MaintenanceComponent],
    template: `
    <app-maintenance 
      moduleName="Productos" 
      description="Gestión de catálogo: Crear, editar y eliminar productos o servicios.">
    </app-maintenance>
  `
})
export class ProductosPage { }
