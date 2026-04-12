import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permiso } from '../../../../domain/models/perfil.model';
import { PermissionItemComponent } from './permission-item.component';

@Component({
  selector: 'app-profile-permissions-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PermissionItemComponent],
  template: `
    <div class="editorial-modal-overlay" (click)="close()">
      <div class="editorial-modal-container" (click)="$event.stopPropagation()">
        
        <div class="editorial-modal-header border-0 bg-transparent px-4 pt-4 pb-2">
          <div class="d-flex align-items-center gap-3">
            <div class="editorial-module-icon-orb" [ngClass]="getModuleIcon(modulo)">
              <i class="bi" [ngClass]="getModuleIconClass(modulo)"></i>
            </div>
            <div class="module-title-wrap">
              <h2 class="h4 fw-bold mb-0 text-uppercase">{{ modulo }}</h2>
              <span class="editorial-badge secondary small">
                {{ getGrantedCount() }} concedidos de {{ permisos.length }}
              </span>
            </div>
          </div>
          <button (click)="close()" class="btn-editorial-close">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="editorial-modal-body px-4 py-3 scroll-custom">
          <div class="permissions-editorial-stack">
            <app-permission-item 
              *ngFor="let perm of permisos" 
              [permiso]="perm">
            </app-permission-item>
          </div>
          
          <div *ngIf="permisos.length === 0" class="text-center py-5">
            <i class="bi bi-shield-slash fs-1 opacity-25 d-block mb-3"></i>
            <p class="text-muted fw-bold">No hay permisos definidos para este módulo.</p>
          </div>
        </div>

        <div class="editorial-modal-footer px-4 py-3 border-0 bg-transparent d-flex justify-content-end">
          <button (click)="close()" class="btn-editorial-action px-5">Entendido</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editorial-modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 1.5rem;
    }
    .editorial-modal-container {
      background: white; width: 800px;
      max-width: 100%; max-height: 85vh; border-radius: 32px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 100px -20px rgba(0,0,0,0.25);
    }
    .editorial-modal-header { display: flex; justify-content: space-between; align-items: flex-start; }
    
    .editorial-module-icon-orb {
      width: 56px; height: 56px; border-radius: 18px;
      display: flex; align-items: center; justify-content: center; font-size: 1.75rem;
      &.clientes { background: #eff6ff; color: #3b82f6; }
      &.productos { background: #fdf2f8; color: #db2777; }
      &.facturas { background: #ecfdf5; color: #10b981; }
      &.configuracion { background: #f1f5f9; color: #64748b; }
      &.default { background: #f8fafc; color: #94a3b8; }
    }

    .btn-editorial-close {
      background: #f1f5f9; border: none; width: 42px; height: 42px;
      border-radius: 12px; color: #64748b; font-size: 1.5rem;
      transition: all 0.2s;
      &:hover { background: #e2e8f0; color: #1e293b; }
    }
    
    .editorial-modal-body { overflow-y: auto; flex: 1; }
    .permissions-editorial-stack { display: flex; flex-direction: column; gap: 0.85rem; }
    
    .btn-editorial-action {
      background: #1e293b; color: white; border: none; height: 52px;
      border-radius: 16px; font-weight: 850; font-size: 0.95rem;
      transition: all 0.2s;
      &:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.2); }
    }

    .editorial-badge {
      font-size: 0.65rem; font-weight: 900; padding: 3px 10px; border-radius: 8px;
      &.secondary { background: #f1f5f9; color: #64748b; margin-top: 4px; display: inline-block; }
    }

    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
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
