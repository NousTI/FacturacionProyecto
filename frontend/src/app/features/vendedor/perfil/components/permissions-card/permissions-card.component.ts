
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-permissions-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="card bg-white border-0 shadow-sm p-4 h-100">
      <h3 class="fw-bold mb-4 text-primary">Permisos y Accesos</h3>
      
      <div class="list-group list-group-flush">
        
        <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom-dashed py-3">
          <div>
            <h6 class="mb-0 fw-semibold text-dark">Crear Empresas</h6>
            <small class="text-muted">Capacidad para registrar nuevas empresas en el sistema</small>
          </div>
          <span class="badge rounded-pill" [ngClass]="canCreateCompanies ? 'bg-success' : 'bg-secondary'">
            {{ canCreateCompanies ? 'Habilitado' : 'Deshabilitado' }}
          </span>
        </div>

        <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom-dashed py-3">
          <div>
            <h6 class="mb-0 fw-semibold text-dark">Gestionar Planes</h6>
            <small class="text-muted">Modificar planes y suscripciones de clientes</small>
          </div>
          <span class="badge rounded-pill" [ngClass]="canManagePlans ? 'bg-success' : 'bg-secondary'">
             {{ canManagePlans ? 'Habilitado' : 'Deshabilitado' }}
          </span>
        </div>

        <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom-dashed py-3">
          <div>
            <h6 class="mb-0 fw-semibold text-dark">Acceso a Empresas</h6>
            <small class="text-muted">Ingresar al dashboard de empresas asignadas</small>
          </div>
          <span class="badge rounded-pill" [ngClass]="canAccessCompanies ? 'bg-success' : 'bg-secondary'">
             {{ canAccessCompanies ? 'Habilitado' : 'Deshabilitado' }}
          </span>
        </div>

        <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom-dashed py-3">
          <div>
            <h6 class="mb-0 fw-semibold text-dark">Ver Reportes</h6>
            <small class="text-muted">Acceso a reportes financieros avanzados</small>
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
        font-size: 0.75rem;
        padding: 0.5em 1em;
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
