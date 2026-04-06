import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../../../domain/models/proveedor.model';

@Component({
    selector: 'app-toggle-proveedor-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container" (click)="$event.stopPropagation()">

        <!-- Icono central -->
        <div class="icon-wrapper" [ngClass]="proveedor.activo ? 'warning' : 'success'">
          <i class="bi" [ngClass]="proveedor.activo ? 'bi-toggle-off' : 'bi-toggle-on'"></i>
        </div>

        <!-- Contenido -->
        <div class="modal-body-content">
          <h2 class="modal-title">
            {{ proveedor.activo ? 'Desactivar Proveedor' : 'Activar Proveedor' }}
          </h2>
          <p class="modal-desc">
            {{ proveedor.activo
              ? 'Al desactivar este proveedor ya no aparecerá como disponible en el directorio activo.'
              : 'Al activar este proveedor volverá a aparecer en el directorio activo.'
            }}
          </p>

          <!-- Card con info del proveedor -->
          <div class="proveedor-card">
            <div class="proveedor-avatar" [style.background]="getAvatarColor(proveedor.razon_social, 0.12)" [style.color]="getAvatarColor(proveedor.razon_social, 1)">
              {{ getInitials(proveedor.razon_social) }}
            </div>
            <div class="proveedor-info">
              <span class="proveedor-name">{{ proveedor.razon_social }}</span>
              <span class="proveedor-id">{{ proveedor.tipo_identificacion }} · {{ proveedor.identificacion }}</span>
            </div>
            <div class="current-status" [ngClass]="proveedor.activo ? 'activo' : 'inactivo'">
              <span class="dot"></span>
              {{ proveedor.activo ? 'ACTIVO' : 'INACTIVO' }}
            </div>
          </div>

          <p class="cambio-label">
            <i class="bi bi-arrow-right-circle-fill me-2"></i>
            Nuevo estado:
            <strong [ngClass]="proveedor.activo ? 'text-danger' : 'text-success'">
              {{ proveedor.activo ? 'INACTIVO' : 'ACTIVO' }}
            </strong>
          </p>
        </div>

        <!-- Footer -->
        <div class="modal-footer-btns">
          <button (click)="close()" class="btn-cancel" [disabled]="loading">
            Cancelar
          </button>
          <button (click)="confirm()" class="btn-confirm" [ngClass]="proveedor.activo ? 'danger' : 'success'" [disabled]="loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading
              ? (proveedor.activo ? 'Desactivando...' : 'Activando...')
              : (proveedor.activo ? 'Sí, desactivar' : 'Sí, activar')
            }}
          </button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.35); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 10001; padding: 1rem;
    }

    .modal-container {
      background: white;
      width: 460px;
      max-width: 95vw;
      border-radius: 28px;
      padding: 2.5rem 2rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 40px 80px -20px rgba(15, 23, 42, 0.25);
      animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .icon-wrapper {
      width: 72px; height: 72px;
      border-radius: 22px;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem;
    }
    .icon-wrapper.warning { background: #fff7ed; color: #f59e0b; }
    .icon-wrapper.success { background: #f0fdf4; color: #10b981; }

    .modal-body-content {
      width: 100%;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .modal-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
      letter-spacing: -0.4px;
    }

    .modal-desc {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      font-weight: 500;
      line-height: 1.6;
      max-width: 340px;
      margin: 0 auto;
    }

    .proveedor-card {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      text-align: left;
      margin-top: 0.25rem;
    }

    .proveedor-avatar {
      width: 46px; height: 46px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1rem;
      flex-shrink: 0;
    }

    .proveedor-info {
      flex: 1;
      display: flex; flex-direction: column; gap: 0.2rem;
    }

    .proveedor-name {
      font-size: 0.9rem; font-weight: 700; color: #1e293b;
    }

    .proveedor-id {
      font-size: 0.72rem; color: #94a3b8; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.4px;
    }

    .current-status {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.3rem 0.75rem; border-radius: 10px;
      font-size: 0.65rem; font-weight: 800; letter-spacing: 0.2px;
      flex-shrink: 0;
    }
    .current-status.activo  { background: #f0fdf4; color: #16a34a; }
    .current-status.inactivo { background: #fef2f2; color: #dc2626; }
    .current-status .dot { width: 5px; height: 5px; border-radius: 50%; }
    .current-status.activo .dot  { background: #16a34a; }
    .current-status.inactivo .dot { background: #dc2626; }

    .cambio-label {
      font-size: 0.82rem;
      color: #475569;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
    }
    .cambio-label i { font-size: 1rem; color: #94a3b8; }
    .cambio-label strong.text-success { color: #16a34a !important; }
    .cambio-label strong.text-danger  { color: #dc2626 !important; }

    .modal-footer-btns {
      display: flex;
      gap: 0.75rem;
      width: 100%;
      margin-top: 0.5rem;
    }

    .btn-cancel {
      flex: 1;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 0.85rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: #64748b;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-cancel:hover:not(:disabled) { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
    .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-confirm {
      flex: 1;
      border: none;
      border-radius: 14px;
      padding: 0.85rem;
      font-weight: 800;
      font-size: 0.9rem;
      color: white;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-confirm.danger  { background: #ef4444; }
    .btn-confirm.success { background: #10b981; }
    .btn-confirm.danger:hover:not(:disabled)  { background: #dc2626; transform: translateY(-1px); box-shadow: 0 8px 16px -4px rgba(239,68,68,0.4); }
    .btn-confirm.success:hover:not(:disabled) { background: #059669; transform: translateY(-1px); box-shadow: 0 8px 16px -4px rgba(16,185,129,0.4); }
    .btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
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
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
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
