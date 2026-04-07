
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-permissions-card',
    standalone: true,
    imports: [CommonModule],
  template: `
    <div class="card-empresas-style h-100 p-4">
        <h5 class="fw-bold mb-4 text-dark header-font d-flex align-items-center gap-2">
            <i class="bi bi-shield-check text-primary"></i> Permisos y Accesos
        </h5>
        
        <div class="d-flex flex-column gap-3">
            
            <div class="permission-item d-flex align-items-center justify-content-between p-3 rounded-3" [class.bg-light]="!canCreateCompanies">
                <div class="d-flex align-items-center gap-3" [class.opacity-50]="!canCreateCompanies">
                    <div class="icon-box" [ngClass]="canCreateCompanies ? 'bg-success-soft text-success' : 'bg-secondary text-white'">
                        <i class="bi bi-building-add"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 text-dark fw-bold">Crear Empresas</h6>
                        <small class="text-muted">Registro de nuevas empresas</small>
                    </div>
                </div>
                <div>
                   <i class="bi fs-5" [ngClass]="canCreateCompanies ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'"></i>
                </div>
            </div>

            <div class="permission-item d-flex align-items-center justify-content-between p-3 rounded-3" [class.bg-light]="!canManagePlans">
                <div class="d-flex align-items-center gap-3" [class.opacity-50]="!canManagePlans">
                    <div class="icon-box" [ngClass]="canManagePlans ? 'bg-primary-soft text-primary' : 'bg-secondary text-white'">
                        <i class="bi bi-card-checklist"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 text-dark fw-bold">Gestionar Planes</h6>
                        <small class="text-muted">Asignar planes de suscripción</small>
                    </div>
                </div>
                <div>
                   <i class="bi fs-5" [ngClass]="canManagePlans ? 'bi-check-circle-fill text-primary' : 'bi-x-circle-fill text-muted'"></i>
                </div>
            </div>

            <div class="permission-item d-flex align-items-center justify-content-between p-3 rounded-3" [class.bg-light]="!canAccessCompanies">
                <div class="d-flex align-items-center gap-3" [class.opacity-50]="!canAccessCompanies">
                    <div class="icon-box" [ngClass]="canAccessCompanies ? 'bg-info-soft text-info' : 'bg-secondary text-white'">
                        <i class="bi bi-buildings"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 text-dark fw-bold">Acceso a Empresas</h6>
                        <small class="text-muted">Ingresar al dashboard asignado</small>
                    </div>
                </div>
                <div>
                   <i class="bi fs-5" [ngClass]="canAccessCompanies ? 'bi-check-circle-fill text-info' : 'bi-x-circle-fill text-muted'"></i>
                </div>
            </div>

            <div class="permission-item d-flex align-items-center justify-content-between p-3 rounded-3" [class.bg-light]="!canViewReports">
                <div class="d-flex align-items-center gap-3" [class.opacity-50]="!canViewReports">
                    <div class="icon-box" [ngClass]="canViewReports ? 'bg-warning-soft text-warning' : 'bg-secondary text-white'">
                        <i class="bi bi-graph-up-arrow"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 text-dark fw-bold">Ver Reportes</h6>
                        <small class="text-muted">Estadísticas avanzadas</small>
                    </div>
                </div>
                <div>
                   <i class="bi fs-5" [ngClass]="canViewReports ? 'bi-check-circle-fill text-warning' : 'bi-x-circle-fill text-muted'"></i>
                </div>
            </div>

        </div>
    </div>
  `,
  styles: [`
    .card-empresas-style {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    }
    
    .header-font { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.5px; }
    
    .permission-item {
        border: 1px solid rgba(0,0,0,0.05);
        transition: all 0.2s;
    }
    .permission-item:hover {
        background: #f8fafc;
        transform: translateY(-2px);
    }
    
    .icon-box {
        width: 42px; height: 42px;
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.25rem;
    }

    .bg-success-soft { background: #dcfce7; }
    .bg-primary-soft { background: #dbeafe; }
    .bg-info-soft { background: #cffafe; color: #0284c7 !important; }
    .bg-warning-soft { background: #fef3c7; color: #d97706 !important; }
    
    .opacity-50 {
        opacity: 0.5 !important;
    }
  `]
})
export class PermissionsCardComponent {
    @Input() canCreateCompanies: boolean = false;
    @Input() canManagePlans: boolean = false;
    @Input() canAccessCompanies: boolean = false;
    @Input() canViewReports: boolean = false;
}
