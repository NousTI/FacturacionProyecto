import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../../../domain/models/proveedor.model';

@Component({
    selector: 'app-proveedor-detail-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-lux-container" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-lux-header">
          <div class="d-flex align-items-center gap-4">
            <div class="avatar-hero" [style.background]="getAvatarColor(proveedor.razon_social, 0.12)" [style.color]="getAvatarColor(proveedor.razon_social, 1)">
              {{ getInitials(proveedor.razon_social) }}
            </div>
            <div>
              <h2 class="modal-lux-title">{{ proveedor.razon_social }}</h2>
              <p class="modal-lux-subtitle">{{ proveedor.nombre_comercial || proveedor.tipo_identificacion }}</p>
            </div>
          </div>
          <div class="d-flex align-items-center gap-3">
            <div class="status-badge" [ngClass]="proveedor.activo ? 'activo' : 'inactivo'">
              <span class="dot"></span>
              {{ proveedor.activo ? 'ACTIVO' : 'INACTIVO' }}
            </div>
            <button (click)="onClose.emit()" class="btn-close-lux">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>

        <div class="modal-lux-body scroll-custom">

          <!-- IDENTIFICACIÓN -->
          <div class="detail-section">
            <h3 class="section-title"><i class="bi bi-card-text"></i> Identificación Legal</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Tipo de Documento</span>
                <span class="detail-value badge-type">{{ proveedor.tipo_identificacion }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Número</span>
                <span class="detail-value mono">{{ proveedor.identificacion }}</span>
              </div>
            </div>
          </div>

          <!-- CONTACTO -->
          <div class="detail-section">
            <h3 class="section-title"><i class="bi bi-person-lines-fill"></i> Información de Contacto</h3>
            <div class="detail-grid">
              <div class="detail-item" *ngIf="proveedor.email">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ proveedor.email }}</span>
              </div>
              <div class="detail-item" *ngIf="proveedor.telefono">
                <span class="detail-label">Teléfono</span>
                <span class="detail-value">{{ proveedor.telefono }}</span>
              </div>
              <div class="detail-item" *ngIf="proveedor.direccion">
                <span class="detail-label">Dirección</span>
                <span class="detail-value">{{ proveedor.direccion }}</span>
              </div>
              <div class="detail-item" *ngIf="proveedor.ciudad">
                <span class="detail-label">Ciudad</span>
                <span class="detail-value">{{ proveedor.ciudad }}</span>
              </div>
              <div class="detail-item" *ngIf="proveedor.provincia">
                <span class="detail-label">Provincia</span>
                <span class="detail-value">{{ proveedor.provincia }}</span>
              </div>
            </div>
          </div>

          <!-- CRÉDITO -->
          <div class="detail-section">
            <h3 class="section-title"><i class="bi bi-calendar-check"></i> Condiciones de Crédito</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Días de Crédito</span>
                <span class="detail-value">{{ proveedor.dias_credito }} días</span>
              </div>
            </div>
          </div>

          <!-- AUDITORÍA -->
          <div class="detail-section border-0">
            <h3 class="section-title"><i class="bi bi-clock-history"></i> Registro</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Creado</span>
                <span class="detail-value">{{ proveedor.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Última actualización</span>
                <span class="detail-value">{{ proveedor.updated_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-lux-footer">
          <button (click)="onClose.emit()" class="btn-lux-outline ms-auto d-block">Cerrar</button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.3); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;
    }
    .modal-lux-container {
      background: white; width: 680px; max-width: 95vw; max-height: 90vh;
      border-radius: 32px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 100px -20px rgba(15, 23, 42, 0.2);
    }
    .modal-lux-header {
      padding: 1.75rem 2.5rem; display: flex; justify-content: space-between;
      align-items: center; border-bottom: 1px solid #f1f5f9;
    }
    .avatar-hero {
      width: 56px; height: 56px; border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.1rem; flex-shrink: 0;
    }
    .modal-lux-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0; }
    .modal-lux-subtitle { font-size: 0.8rem; color: #94a3b8; margin: 0.15rem 0 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .btn-close-lux {
      background: #f8fafc; border: none; width: 36px; height: 36px;
      border-radius: 10px; color: #94a3b8; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .btn-close-lux:hover { background: #f1f5f9; color: #1e293b; }
    .status-badge {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.9rem; border-radius: 10px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.2px;
    }
    .status-badge.activo { background: #f0fdf4; color: #16a34a; }
    .status-badge.inactivo { background: #fef2f2; color: #dc2626; }
    .status-badge .dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-badge.activo .dot { background: #16a34a; }
    .status-badge.inactivo .dot { background: #dc2626; }
    .modal-lux-body { padding: 2rem 2.5rem; overflow-y: auto; flex: 1; }
    .detail-section { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #f1f5f9; }
    .section-title { font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
    .section-title i { font-size: 0.95rem; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.3rem; }
    .detail-label { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
    .detail-value { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
    .detail-value.mono { font-family: monospace; font-size: 0.9rem; letter-spacing: 0.5px; }
    .badge-type { display: inline-block; padding: 0.3rem 0.75rem; background: #eff6ff; color: #3b82f6; border-radius: 8px; font-size: 0.75rem; font-weight: 700; width: fit-content; }
    .modal-lux-footer { padding: 1.5rem 2.5rem; background: white; border-top: 1px solid #f1f5f9; display: flex; }
    .btn-lux-outline {
      background: white; color: #64748b; border: 1px solid #f1f5f9;
      padding: 0.75rem 1.75rem; border-radius: 14px; font-weight: 700; font-size: 0.9rem; transition: all 0.2s;
    }
    .btn-lux-outline:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class ProveedorDetailModalComponent implements OnInit, OnDestroy {
    @Input() proveedor!: Proveedor;
    @Output() onClose = new EventEmitter<void>();

    ngOnInit() { document.body.style.overflow = 'hidden'; }
    ngOnDestroy() { document.body.style.overflow = 'auto'; }

    getInitials(name: string): string {
        if (!name) return '??';
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    }

    getAvatarColor(name: string, opacity: number): string {
        if (!name) return `rgba(148, 163, 184, ${opacity})`;
        const colors = [
            `rgba(99, 102, 241, ${opacity})`,
            `rgba(16, 185, 129, ${opacity})`,
            `rgba(245, 158, 11, ${opacity})`,
            `rgba(239, 68, 68, ${opacity})`,
            `rgba(139, 92, 246, ${opacity})`,
            `rgba(20, 184, 166, ${opacity})`
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
        return colors[Math.abs(hash) % colors.length];
    }
}
