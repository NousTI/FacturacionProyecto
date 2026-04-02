
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-permissions-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="card bg-white border-0 shadow-sm p-3 h-100">
      <h6 class="fw-bold mb-3 text-primary">Permisos y Accesos</h6>
      
      <div class="list-group list-group-flush">
        
        <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom-dashed py-2">
          <div>
            <h6 class="mb-0 fw-semibold text-dark small">Crear Empresas</h6>
            <small class="text-muted smallest">Registro de nuevas empresas</small>
          </div>
          <span class="badge rounded-pill" [ngClass]="canCreateCompanies ? 'bg-success' : 'bg-secondary'">
            {{ canCreateCompanies ? 'Habilitado' : 'Deshabilitado' }}
          </span>
        </div>

        <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom-dashed py-2">
          <div>
            <h6 class="mb-0 fw-semibold text-dark small">Gestionar Planes</h6>
            <small class="text-muted smallest">Modificar planes y suscripciones</small>
          </div>
          <span class="badge rounded-pill" [ngClass]="canManagePlans ? 'bg-success' : 'bg-secondary'">
             {{ canManagePlans ? 'Habilitado' : 'Deshabilitado' }}
          </span>
        </div>

        <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom-dashed py-2">
          <div>
            <h6 class="mb-0 fw-semibold text-dark small">Acceso a Empresas</h6>
            <small class="text-muted smallest">Dashboard de empresas asignadas</small>
          </div>
          <span class="badge rounded-pill" [ngClass]="canAccessCompanies ? 'bg-success' : 'bg-secondary'">
             {{ canAccessCompanies ? 'Habilitado' : 'Deshabilitado' }}
          </span>
        </div>

        <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom-dashed py-2">
          <div>
            <h6 class="mb-0 fw-semibold text-dark small">Ver Reportes</h6>
            <small class="text-muted smallest">Reportes financieros avanzados</small>
          </div>
          <span class="badge rounded-pill" [ngClass]="canViewReports ? 'bg-success' : 'bg-secondary'">
             {{ canViewReports ? 'Habilitado' : 'Deshabilitado' }}
          </span>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .border-bottom-dashed {
        border-bottom: 1px dashed #e2e8f0 !important;
    }
    .badge {
        font-size: 0.65rem;
        padding: 0.35em 0.8em;
        font-weight: 600;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class PermissionsCardComponent {
    @Input() canCreateCompanies: boolean = false;
    @Input() canManagePlans: boolean = false;
    @Input() canAccessCompanies: boolean = false;
    @Input() canViewReports: boolean = false;
}
