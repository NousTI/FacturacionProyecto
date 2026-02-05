import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permiso } from '../../../../domain/models/perfil.model';
import { PermissionItemComponent } from './permission-item.component';

@Component({
    selector: 'app-profile-permissions',
    standalone: true,
    imports: [CommonModule, PermissionItemComponent],
    template: `
    <div class="card card-detail">
      <div class="card-header-premium">
        <div class="d-flex justify-content-between align-items-center w-100">
          <span><i class="bi bi-shield-lock me-2"></i> Mis Atribuciones y Permisos</span>
          <div class="header-stats">
            <span class="badge-stats granted">{{ countGranted(permisos) }} Activos</span>
            <span class="badge-stats total">{{ permisos.length }} Totales</span>
          </div>
        </div>
      </div>
      
      <div class="card-body p-4 pt-0">
        <div class="accordion-premium">
          <div *ngFor="let module of getModules(permisos)" class="accordion-item-premium" [class.active]="activeModule === module">
            <div class="accordion-header-premium" (click)="toggleModule(module)">
              <div class="d-flex align-items-center">
                <div class="module-icon" [ngClass]="getModuleIcon(module)">
                  <i class="bi" [ngClass]="getModuleIconClass(module)"></i>
                </div>
                <div>
                  <span class="module-name text-uppercase">{{ module }}</span>
                  <span class="module-count">{{ getPermisosByModulo(permisos, module).length }} ítems en este módulo</span>
                </div>
              </div>
              <i class="bi bi-chevron-down chevron-icon"></i>
            </div>
            
            <div class="accordion-content-premium">
              <div class="permisos-grid">
                <app-permission-item 
                  *ngFor="let perm of getPermisosByModulo(permisos, module)" 
                  [permiso]="perm">
                </app-permission-item>
              </div>
            </div>
          </div>

          <div *ngIf="permisos.length === 0" class="text-center py-5">
            <i class="bi bi-info-circle fs-2 text-muted mb-2 d-block"></i>
            <p class="text-muted">No se encontraron definiciones de permisos disponibles.</p>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .card-detail {
      background: white;
      border: 1px solid #eef2f6;
      border-radius: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
      overflow: hidden;
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

    .accordion-premium { display: flex; flex-direction: column; gap: 12px; }
    .accordion-item-premium {
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s ease;
      background: #ffffff;
    }
    .accordion-item-premium.active {
      border-color: #161d35;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
    }
    .accordion-header-premium {
      padding: 1.25rem 1.5rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
    }
    .accordion-header-premium:hover { background: #fcfdfe; }

    .module-icon {
      width: 44px; height: 44px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin-right: 1.25rem;
      font-size: 1.25rem;
    }
    .module-icon.clientes { background: #eff6ff; color: #2563eb; }
    .module-icon.productos { background: #fdf2f8; color: #db2777; }
    .module-icon.facturas { background: #ecfdf5; color: #059669; }
    .module-icon.configuracion { background: #f1f5f9; color: #475569; }
    .module-icon.default { background: #f8fafc; color: #94a3b8; }

    .module-name {
      display: block; font-weight: 900; font-size: 0.9rem;
      color: #1e293b; letter-spacing: 0.5px;
    }
    .module-count { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }

    .chevron-icon { font-size: 1.1rem; color: #cbd5e1; transition: transform 0.3s; }
    .active .chevron-icon { transform: rotate(180deg); color: #161d35; }

    .accordion-content-premium {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      background: #fafbfc;
    }
    .active .accordion-content-premium {
      max-height: 2000px;
      border-top: 1px solid #f1f5f9;
    }

    .permisos-grid {
      padding: 1.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .permisos-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfilePermissionsComponent {
    @Input() permisos: Permiso[] = [];
    activeModule: string | null = null;

    toggleModule(moduleName: string) {
        this.activeModule = this.activeModule === moduleName ? null : moduleName;
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
