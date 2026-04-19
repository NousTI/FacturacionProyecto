import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permiso } from '../../../../domain/models/perfil.model';
import { ProfilePermissionsModalComponent } from './profile-permissions-modal.component';

@Component({
  selector: 'app-profile-permissions-list-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProfilePermissionsModalComponent],
  template: `
    <div class="editorial-card mb-4 p-0 shadow-sm" style="overflow: hidden;">
      <div class="card-header-minimal-editorial px-4 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-shield-check text-dark"></i>
          <span>Alcance de Permisos</span>
        </div>
        <div class="header-stats-editorial d-flex gap-2">
          <span class="editorial-badge success small">{{ countGranted(permisos) }} Activos</span>
          <span class="editorial-badge neutral small">{{ permisos.length }} Totales</span>
        </div>
      </div>
      
      <div class="card-body-minimal-editorial p-4">
        <div class="modules-grid-editorial">
          <div *ngFor="let module of getModules(permisos)" 
               class="module-item-editorial" 
               (click)="selectedModule = module">
            <div class="d-flex align-items-center">
              <div class="module-icon-box" [ngClass]="getModuleIcon(module)">
                <i class="bi" [ngClass]="getModuleIconClass(module)"></i>
              </div>
              <div class="module-info-editorial">
                <span class="module-title-editorial">{{ module }}</span>
                <span class="module-count-editorial">{{ getPermisosByModulo(permisos, module).length }} capacidades</span>
              </div>
            </div>
            <i class="bi bi-chevron-right text-muted opacity-50 pe-1"></i>
          </div>

          <div *ngIf="permisos.length === 0" class="empty-permissions-editorial text-center py-4">
             <i class="bi bi-info-circle opacity-50 fs-2 d-block mb-2"></i>
             <p class="small text-muted mb-0">No se han definido permisos específicos aún.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalle -->
    <app-profile-permissions-modal
      *ngIf="selectedModule"
      [modulo]="selectedModule"
      [permisos]="getPermisosByModulo(permisos, selectedModule)"
      (onClose)="selectedModule = null">
    </app-profile-permissions-modal>
  `,
  styles: [`
    .editorial-card { background: white; border: 1px solid #f1f5f9; border-radius: 24px; }
    .card-header-minimal-editorial {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9;
      font-weight: 900; font-size: 0.85rem; color: black;
      background: #f8fafc; text-transform: uppercase; letter-spacing: 0.05em;
    }
    
    .editorial-badge {
      font-size: 0.65rem; font-weight: 900; padding: 4px 10px; border-radius: 8px;
      &.success { background: #dcfce7; color: #15803d; }
      &.neutral { background: #f1f5f9; color: #64748b; }
    }

    .modules-grid-editorial { 
      display: flex; flex-direction: column; gap: 0.75rem; 
      max-height: 400px; overflow-y: auto; padding-right: 8px;
    }
    .modules-grid-editorial::-webkit-scrollbar { width: 5px; }
    .modules-grid-editorial::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    
    .module-item-editorial {
      border: 1.5px solid #f1f5f9; border-radius: 16px; padding: 1rem 1.25rem;
      cursor: pointer; display: flex; justify-content: space-between; align-items: center;
      background: #fafbfc; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { border-color: black; background: #fff; transform: translateX(5px); box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05); }
    }

    .module-icon-box {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      margin-right: 1rem; font-size: 1.2rem; flex-shrink: 0;
      &.clientes { background: #eff6ff; color: black; }
      &.productos { background: #fdf2f8; color: #db2777; }
      &.facturas { background: #ecfdf5; color: #10b981; }
      &.configuracion { background: #f1f5f9; color: #64748b; }
      &.default { background: #f8fafc; color: #94a3b8; }
    }

    .module-info-editorial { display: flex; flex-direction: column; }
    .module-title-editorial { display: block; font-weight: 850; font-size: 0.95rem; color: black; text-transform: uppercase; }
    .module-count-editorial { font-size: 0.75rem; color: #94a3b8; font-weight: 700; }
  `]
})
export class ProfilePermissionsListCardComponent {
  @Input() permisos: Permiso[] = [];
  selectedModule: string | null = null;

  getModules(permisos: Permiso[]): string[] {
    const modules = permisos.map(p => p.modulo);
    return [...new Set(modules)].sort();
  }

  getPermisosByModulo(permisos: Permiso[], modulo: string) {
    return permisos.filter(p => p.modulo === modulo);
  }

  countGranted(permisos: Permiso[]): number {
    return permisos.filter(p => p.concedido).length;
  }

  getModuleIcon(module: string): string {
    const m = module.toLowerCase();
    if (m.includes('cliente')) return 'clientes';
    if (m.includes('product')) return 'productos';
    if (m.includes('factura')) return 'facturas';
    if (m.includes('config')) return 'configuracion';
    return 'default';
  }

  getModuleIconClass(module: string): string {
    const m = module.toLowerCase();
    if (m.includes('cliente')) return 'bi-people-fill';
    if (m.includes('product')) return 'bi-box-seam-fill';
    if (m.includes('factura')) return 'bi-receipt-cutoff';
    if (m.includes('config')) return 'bi-gear-wide-connected';
    return 'bi-folder-fill';
  }
}



