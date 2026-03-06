import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permiso } from '../../../../domain/models/perfil.model';
import { PermissionItemComponent } from './permission-item.component';

@Component({
  selector: 'app-profile-permissions-modal',
  standalone: true,
  imports: [CommonModule, PermissionItemComponent],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-lux" (click)="$event.stopPropagation()">
        
        <div class="modal-header-lux">
          <div class="module-header">
            <div class="module-icon-large" [ngClass]="getModuleIcon(modulo)">
              <i class="bi" [ngClass]="getModuleIconClass(modulo)"></i>
            </div>
            <div class="module-info-text">
              <h2 class="module-name text-uppercase">{{ modulo }}</h2>
              <span class="module-stats">
                {{ getGrantedCount() }} de {{ permisos.length }} permisos concedidos
              </span>
            </div>
          </div>
          <button (click)="close()" class="btn-close-lux">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-lux scroll-custom">
          <div class="permisos-list">
            <app-permission-item 
              *ngFor="let perm of permisos" 
              [permiso]="perm">
            </app-permission-item>
          </div>
          
          <div *ngIf="permisos.length === 0" class="text-center py-5">
            <i class="bi bi-info-circle fs-2 text-muted mb-2 d-block"></i>
            <p class="text-muted">No se encontraron permisos en este módulo.</p>
          </div>
        </div>

        <div class="modal-footer-lux">
          <button (click)="close()" class="btn-primary-lux px-4">Cerrar</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 1rem;
    }
    .modal-container-lux {
      background: #ffffff; width: 750px;
      max-width: 95vw; max-height: 90vh; border-radius: 32px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 50px 100px -20px rgba(15, 23, 53, 0.3);
    }
    .modal-header-lux {
      background: linear-gradient(to right, #f8fafc, #ffffff);
      padding: 2rem 2.5rem; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .module-header { display: flex; align-items: center; gap: 1.5rem; }
    .module-icon-large {
      width: 64px; height: 64px; border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem;
    }
    .module-icon-large.clientes { background: #eff6ff; color: #2563eb; }
    .module-icon-large.productos { background: #fdf2f8; color: #db2777; }
    .module-icon-large.facturas { background: #ecfdf5; color: #059669; }
    .module-icon-large.configuracion { background: #f1f5f9; color: #475569; }
    .module-icon-large.default { background: #f8fafc; color: #94a3b8; }

    .module-name { font-size: 1.5rem; font-weight: 800; color: #161d35; margin: 0; letter-spacing: -0.5px; }
    .module-stats { font-size: 0.85rem; font-weight: 600; color: #64748b; }

    .btn-close-lux { background: white; border: 1.5px solid #f1f5f9; width: 44px; height: 44px; border-radius: 12px; color: #64748b; font-size: 1.25rem; }
    
    .modal-body-lux { padding: 2.5rem; overflow-y: auto; flex: 1; background: #fafbfc; }
    
    .permisos-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .modal-footer-lux { padding: 1.5rem 2.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; background: white; }
    .btn-primary-lux { background: #161d35; color: white; border: none; height: 48px; border-radius: 14px; font-weight: 700; transition: all 0.2s; }
    .btn-primary-lux:hover { background: #262f4d; transform: translateY(-1px); }
    
    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    @media (max-width: 768px) {
      .modal-header-lux { padding: 1.5rem; }
      .module-header { gap: 1rem; }
      .module-icon-large { width: 48px; height: 48px; font-size: 1.5rem; }
      .module-name { font-size: 1.25rem; }
    }
  `]
})
export class ProfilePermissionsModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) modulo!: string;
  @Input({ required: true }) permisos: Permiso[] = [];
  @Output() onClose = new EventEmitter<void>();

  ngOnInit() { document.body.style.overflow = 'hidden'; }
  ngOnDestroy() { document.body.style.overflow = 'auto'; }

  close() { this.onClose.emit(); }

  getGrantedCount(): number {
    return this.permisos.filter(p => p.concedido).length;
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
