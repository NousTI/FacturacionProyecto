import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Rol, Permiso } from '../../../../shared/services/roles.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <div class="card card-minimal shadow-soft h-100" *ngIf="role; else noRoleSelected">
      <div class="card-header-minimal d-flex justify-content-between align-items-center border-bottom">
        <div class="d-flex align-items-center gap-3">
          <div class="role-avatar-minimal">{{ role.nombre.substring(0,2) }}</div>
          <div>
            <h3 class="m-0 fw-bold fs-5 text-dark">{{ role.nombre }}</h3>
            <span class="text-muted small fw-500">{{ role.descripcion || 'Sin descripción' }}</span>
          </div>
        </div>
        <div class="d-flex gap-2">
          <ng-container *ngIf="!role.es_sistema">
            <button *hasPermission="'CONFIG_ROLES'"
                    class="btn btn-minimal-danger" (click)="onDelete.emit(role)">
              <i class="bi bi-trash"></i>
            </button>
          </ng-container>
          <button *hasPermission="'CONFIG_ROLES'" class="btn btn-minimal-primary" (click)="onCreate.emit()">
            <i class="bi bi-plus-circle-fill me-2"></i> Nuevo Rol
          </button>
        </div>
      </div>
      
      <div class="card-body p-4 scroll-thin overflow-auto">
        <div class="section-label-minimal mb-4">Capacidades del Módulo</div>
        <div class="row g-3">
          <div class="col-md-4" *ngFor="let modulo of modulos">
            <div class="minimal-module-card" (click)="onModuleClick.emit(modulo)">
              <div class="module-icon-box" [ngClass]="modulo.toLowerCase()">
                <i class="bi" [ngClass]="getModuleIcon(modulo)"></i>
              </div>
              <div class="module-info-minimal">
                <span class="module-name-minimal">{{ modulo }}</span>
                <span class="module-status-minimal">{{ getSelectedCount(modulo) }} / {{ getPermisosByModulo(modulo).length }} activos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #noRoleSelected>
      <div class="h-100 d-flex flex-column align-items-center justify-content-center text-center p-5 opacity-75">
        <div class="empty-plate-minimal mb-4">
           <i class="bi bi-fingerprint"></i>
        </div>
        <h4 class="fw-bold text-dark">Propiedades de Acceso</h4>
        <p class="text-muted small max-w-300">Selecciona un rol de la lista lateral para visualizar y editar sus privilegios en el sistema.</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .shadow-soft { box-shadow: 0 4px 30px rgba(0,0,0,0.02); }
    .scroll-thin::-webkit-scrollbar { width: 5px; }
    .scroll-thin::-webkit-scrollbar-track { background: transparent; }
    .scroll-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    .card-minimal {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .card-header-minimal { padding: 1.25rem 1.5rem; }

    .role-avatar-minimal {
      width: 44px; height: 44px; border-radius: 14px;
      background: #f1f5f9; color: #64748b; font-weight: 800;
      display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
    }
    .section-label-minimal { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }

    .minimal-module-card {
      padding: 1.25rem;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .minimal-module-card:hover { border-color: #cbd5e1; background: #fafbfc; }
    .module-icon-box {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
      margin-right: 1rem;
    }
    .module-icon-box.clientes { color: #3b82f6; background: #eff6ff; }
    .module-icon-box.productos { color: #ec4899; background: #fdf2f8; }
    .module-icon-box.facturas { color: #10b981; background: #ecfdf5; }
    .module-icon-box.reportes { color: #f59e0b; background: #fff7ed; }
    .module-icon-box.configuracion { color: #64748b; background: #f1f5f9; }

    .module-name-minimal { font-weight: 800; color: #334155; display: block; font-size: 0.9rem; }
    .module-status-minimal { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }

    .btn-minimal-primary {
      background: #1e293b; color: white; border: none; padding: 0.6rem 1.25rem;
      border-radius: 12px; font-weight: 700; font-size: 0.8rem; transition: all 0.2s;
    }
    .btn-minimal-primary:hover { background: #0f172a; }
    .btn-minimal-danger { background: #fff1f2; color: #e11d48; border: none; padding: 0.6rem 0.8rem; border-radius: 12px; }
    .btn-minimal-danger:hover { background: #e11d48; color: white; }

    .empty-plate-minimal {
      width: 70px; height: 70px; border-radius: 20px; background: #f8fafc;
      display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #cbd5e1;
    }
  `]
})
export class RoleDetailComponent {
  @Input() role: Rol | null = null;
  @Input() modulos: string[] = [];
  @Input() permisosDisponibles: Permiso[] = [];
  @Output() onDelete = new EventEmitter<Rol>();
  @Output() onCreate = new EventEmitter<void>();
  @Output() onModuleClick = new EventEmitter<string>();

  getPermisosByModulo(modulo: string) {
    return this.permisosDisponibles.filter(p => p.modulo === modulo);
  }

  getSelectedCount(modulo: string) {
    return this.getPermisosByModulo(modulo).filter(p => p.selected).length;
  }

  getModuleIcon(modulo: string) {
    switch (modulo) {
      case 'CLIENTES': return 'bi-people-fill';
      case 'PRODUCTOS': return 'bi-box-seam-fill';
      case 'FACTURAS': return 'bi-receipt-cutoff';
      case 'REPORTES': return 'bi-bar-chart-fill';
      case 'CONFIGURACION': return 'bi-gear-wide-connected';
      default: return 'bi-shield-check';
    }
  }
}
