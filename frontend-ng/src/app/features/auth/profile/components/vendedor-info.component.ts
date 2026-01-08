import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vendedor-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (vendedor) {
      <!-- Personal Info -->
      <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Documento</span>
        <span class="text-dark">{{ vendedor.documento_identidad || 'No registrado' }}</span>
      </div>
      <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Teléfono</span>
        <span class="text-dark">{{ vendedor.telefono || 'No registrado' }}</span>
      </div>

      <!-- Commission Info -->
      <h6 class="text-uppercase text-secondary small fw-bold mt-4 mb-3">Esquema de Comisiones</h6>
      
      <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Tipo Comisión</span>
        <span class="badge bg-light text-dark border">{{ vendedor.tipo_comision || 'N/A' }}</span>
      </div>
      
      <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Comisión General</span>
        <span class="text-dark fw-bold">{{ vendedor.porcentaje_comision || 0 }}%</span>
      </div>

       <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Comisión Inicial</span>
        <span class="text-dark">{{ vendedor.porcentaje_comision_inicial || 0 }}%</span>
      </div>

       <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Comisión Recurrente</span>
        <span class="text-dark">{{ vendedor.porcentaje_comision_recurrente || 0 }}%</span>
      </div>

      <!-- Permissions -->
      <h6 class="text-uppercase text-secondary small fw-bold mt-4 mb-3">Permisos de Gestión</h6>
      
      <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Crear Empresas</span>
        <span [class.text-success]="vendedor.puede_crear_empresas" [class.text-muted]="!vendedor.puede_crear_empresas" class="fw-bold">
            {{ vendedor.puede_crear_empresas ? 'Sí' : 'No' }}
        </span>
      </div>

      <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Gestionar Planes</span>
        <span [class.text-success]="vendedor.puede_gestionar_planes" [class.text-muted]="!vendedor.puede_gestionar_planes" class="fw-bold">
            {{ vendedor.puede_gestionar_planes ? 'Sí' : 'No' }}
        </span>
      </div>

      <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Ver Reportes</span>
        <span [class.text-success]="vendedor.puede_ver_reportes" [class.text-muted]="!vendedor.puede_ver_reportes" class="fw-bold">
            {{ vendedor.puede_ver_reportes ? 'Sí' : 'No' }}
        </span>
      </div>
    }
  `
})
export class VendedorInfoComponent {
  @Input() user!: any;

  get vendedor(): any {
    return this.user;
  }
}
