import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-permissions-list-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="editorial-card mb-3 p-0" style="overflow: hidden;">
      <div class="card-header-minimal px-4">
        <i class="bi bi-shield-check me-2"></i> Alcance y Permisos
      </div>
      <div class="card-body-minimal p-4">
        <div class="row g-3">
          <div class="col-md-6" *ngFor="let perm of permissionsList">
            <div class="permission-item d-flex align-items-center gap-3 p-2 text-muted" [class.active]="perm.value">
               <div class="perm-icon">
                  <i [class]="perm.icon"></i>
               </div>
               <div>
                  <span class="d-block fw-bold smallest text-dark">{{ perm.label }}</span>
                  <small class="mini-desc">{{ perm.desc }}</small>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editorial-card { max-width: none !important; margin: 0 !important; padding: 0 !important; }
    .card-header-minimal {
      padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color);
      font-weight: 800; font-size: 0.9rem; color: #000000; background: #f8fafc;
    }
    .permission-item {
       border: 1.5px solid #f1f5f9; border-radius: 14px; background: #fafbfc;
       transition: all 0.2s;
    }
    .permission-item.active { border-color: #dcfce7; background: #f0fdf4; opacity: 1; }
    .permission-item .perm-icon {
       width: 36px; height: 36px; border-radius: 10px; background: #fff;
       display: flex; align-items: center; justify-content: center;
       border: 1px solid #f1f5f9; font-size: 1rem;
    }
    .permission-item.active .perm-icon { color: #15803d; border-color: #bbf7d0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .smallest { font-size: 0.75rem; line-height: 1.2; }
    .mini-desc { font-size: 0.65rem; color: #94a3b8; display: block; }
  `]
})
export class PermissionsListCardComponent {
  @Input() perfil: any;

  get permissionsList() {
    if (!this.perfil) return [];
    return [
      { label: 'Gestión de Empresas', desc: 'Registrar nuevas empresas', icon: 'bi bi-building-add', value: this.perfil.puede_crear_empresas },
      { label: 'Control de Planes', desc: 'Asignar planes a empresas', icon: 'bi bi-card-checklist', value: this.perfil.puede_gestionar_planes },
      { label: 'Acceso a Datos', desc: 'Info de empresas', icon: 'bi bi-database-lock', value: this.perfil.puede_acceder_empresas },
      { label: 'Reportes de Ventas', desc: 'Métricas y ganancias', icon: 'bi bi-bar-chart-line', value: this.perfil.puede_ver_reportes }
    ];
  }
}
