import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../../../domain/models/proveedor.model';

@Component({
  selector: 'app-toggle-proveedor-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-container shadow-lg" (click)="$event.stopPropagation()">

        <!-- Icon -->
        <div class="icon-wrapper" [ngClass]="proveedor.activo ? 'warning' : 'success'">
          <i class="bi" [ngClass]="proveedor.activo ? 'bi-toggle-off' : 'bi-toggle-on'"></i>
        </div>

        <!-- Content -->
        <div class="modal-content-text">
          <h2 class="modal-title">
            {{ proveedor.activo ? 'Desactivar Proveedor' : 'Activar Proveedor' }}
          </h2>
          <p class="modal-desc">
            {{ proveedor.activo
              ? 'El proveedor dejará de aparecer en las búsquedas activas de compras y facturación.'
              : 'El proveedor volverá a estar disponible para procesos comerciales.'
            }}
          </p>

          <div class="info-card">
            <div class="avatar-mini" [style.background]="getAvatarColor(proveedor.razon_social, 0.1)" [style.color]="getAvatarColor(proveedor.razon_social, 1)">
              {{ getInitials(proveedor.razon_social) }}
            </div>
            <div class="info-details">
              <span class="p-name">{{ proveedor.razon_social }}</span>
              <span class="p-id">{{ proveedor.identificacion }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-actions">
          <button (click)="close()" class="btn-cancel" [disabled]="loading">Cancelar</button>
          <button (click)="confirm()" class="btn-confirm" [ngClass]="proveedor.activo ? 'danger' : 'success'" [disabled]="loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ proveedor.activo ? 'Sí, Desactivar' : 'Sí, Activar' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10001; padding: 1rem; }
    .modal-container { background: white; width: 100%; max-width: 440px; border-radius: 28px; padding: 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
    .icon-wrapper { width: 72px; height: 72px; border-radius: 22px; display: flex; align-items: center; justify-content: center; font-size: 2.25rem; }
    .icon-wrapper.warning { background: #fff7ed; color: #f59e0b; }
    .icon-wrapper.success { background: #f0fdf4; color: #10b981; }
    .modal-content-text { text-align: center; width: 100%; }
    .modal-title { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .modal-desc { font-size: 0.9rem; color: #64748b; font-weight: 500; line-height: 1.5; margin-bottom: 1.5rem; }
    .info-card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 16px; padding: 1rem; display: flex; align-items: center; gap: 1rem; text-align: left; }
    .avatar-mini { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; flex-shrink: 0; }
    .info-details { display: flex; flex-direction: column; }
    .p-name { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
    .p-id { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
    .modal-actions { display: flex; gap: 0.75rem; width: 100%; }
    .btn-cancel { flex: 1; padding: 0.85rem; border-radius: 14px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 700; transition: all 0.2s; }
    .btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-confirm { flex: 1; padding: 0.85rem; border-radius: 14px; border: none; color: white; font-weight: 800; transition: all 0.2s; }
    .btn-confirm.danger { background: #ef4444; }
    .btn-confirm.success { background: #10b981; }
    .btn-confirm.danger:hover:not(:disabled) { background: #dc2626; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
    .btn-confirm.success:hover:not(:disabled) { background: #059669; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
  `]
})
export class ToggleProveedorModalComponent implements OnInit, OnDestroy {
  @Input() proveedor!: Proveedor;
  @Input() loading: boolean = false;
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  ngOnInit() { document.body.style.overflow = 'hidden'; }
  ngOnDestroy() { document.body.style.overflow = 'auto'; }

  confirm() { this.onConfirm.emit(); }
  close() { if (!this.loading) this.onClose.emit(); }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string, opacity: number): string {
    if (!name) return `rgba(148, 163, 184, ${opacity})`;
    const colors = [
      `rgba(99, 102, 241, ${opacity})`, `rgba(16, 185, 129, ${opacity})`,
      `rgba(245, 158, 11, ${opacity})`, `rgba(239, 68, 68, ${opacity})`,
      `rgba(139, 92, 246, ${opacity})`, `rgba(20, 184, 166, ${opacity})`
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  }
}
