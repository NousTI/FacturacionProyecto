import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permiso } from '../../../../domain/models/perfil.model';
import { ProfilePermissionsModalComponent } from './profile-permissions-modal.component';

@Component({
    selector: 'app-profile-permissions',
    standalone: true,
    imports: [CommonModule, ProfilePermissionsModalComponent],
    template: `
    <div class="card card-detail">
      <div class="card-header-premium">
        <div class="d-flex justify-content-between align-items-center w-100">
          <span><i class="bi bi-shield-lock me-2"></i> Mis Permisos</span>
          <div class="header-stats">
            <span class="badge-stats granted">{{ countGranted(permisos) }} Activos</span>
            <span class="badge-stats total">{{ permisos.length }} Totales</span>
          </div>
        </div>
      </div>
      
      <div class="card-body p-4 pt-0">
        <div class="modules-list">
          <div *ngFor="let module of getModules(permisos)" 
               class="module-item-premium animate__animated animate__fadeInUp" 
               (click)="openModal(module)">
            <div class="d-flex align-items-center">
              <div class="module-icon" [ngClass]="getModuleIcon(module)">
                <i class="bi" [ngClass]="getModuleIconClass(module)"></i>
              </div>
              <div class="module-text-container">
                <span class="module-name text-uppercase">{{ module }}</span>
                <span class="module-count">{{ getPermisosByModulo(permisos, module).length }} permisos en este módulo</span>
              </div>
            </div>
            <div class="action-hint">
              <span class="me-2 d-none d-sm-inline">Ver detalles</span>
              <i class="bi bi-arrow-right-short fs-4"></i>
            </div>
          </div>

          <div *ngIf="permisos.length === 0" class="text-center py-5">
            <i class="bi bi-info-circle fs-2 text-muted mb-2 d-block"></i>
            <p class="text-muted">No se encontraron definiciones de permisos disponibles.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Permission Modal -->
    <app-profile-permissions-modal
      *ngIf="selectedModule"
      [modulo]="selectedModule"
      [permisos]="getPermisosByModulo(permisos, selectedModule)"
      (onClose)="selectedModule = null">
    </app-profile-permissions-modal>
  `,
    styles: [`
    .card-detail {
      background: white;
      border: 1px solid #eef2f6;
      border-radius: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
      overflow: hidden;
      height: 100%;
    }
    .card-header-premium {
      padding: 1.75rem;
      font-weight: 900;
      font-size: 1.15rem;
      color: #161d35;
      display: flex;
      align-items: center;
    }

    .badge-stats {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 80px;
      margin-left: 6px;
    }
    .badge-stats.granted { background: #dcfce7; color: #166534; }
    .badge-stats.total { background: #f1f5f9; color: #475569; }

    .modules-list { display: flex; flex-direction: column; gap: 12px; }
    
    .module-item-premium {
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      padding: 1.25rem 1.5rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .module-item-premium:hover {
      border-color: #161d35;
      background: #fcfdfe;
      transform: translateX(8px);
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
    }

    .module-icon {
      width: 48px; height: 48px;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin-right: 1.25rem;
      font-size: 1.4rem;
      flex-shrink: 0;
    }
    .module-icon.clientes { background: #eff6ff; color: #2563eb; }
    .module-icon.productos { background: #fdf2f8; color: #db2777; }
    .module-icon.facturas { background: #ecfdf5; color: #059669; }
    .module-icon.configuracion { background: #f1f5f9; color: #475569; }
    .module-icon.default { background: #f8fafc; color: #94a3b8; }

    .module-text-container { display: flex; flex-direction: column; gap: 2px; }
    .module-name {
      display: block; font-weight: 900; font-size: 0.95rem;
      color: #1e293b; letter-spacing: 0.5px;
    }
    .module-count { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }

    .action-hint {
      display: flex;
      align-items: center;
      color: #cbd5e1;
      font-size: 0.8rem;
      font-weight: 700;
      transition: all 0.3s;
    }
    .module-item-premium:hover .action-hint {
      color: #161d35;
      transform: translateX(4px);
    }

    @media (max-width: 576px) {
      .module-item-premium { padding: 1rem; }
      .module-icon { width: 40px; height: 40px; font-size: 1.1rem; margin-right: 0.75rem; }
      .module-name { font-size: 0.85rem; }
      .module-count { font-size: 0.7rem; }
    }
  `]
})
export class ProfilePermissionsComponent {
    @Input() permisos: Permiso[] = [];
    selectedModule: string | null = null;

    openModal(moduleName: string) {
        this.selectedModule = moduleName;
    }

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

