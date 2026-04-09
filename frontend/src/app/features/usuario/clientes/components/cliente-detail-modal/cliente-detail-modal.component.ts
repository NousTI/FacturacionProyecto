import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../../../../domain/models/cliente.model';

@Component({
    selector: 'app-cliente-detail-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content-container glass-modal shadow-lg" (click)="$event.stopPropagation()" style="max-width: 800px;">
        
        <!-- Header -->
        <div class="modal-header border-0 pb-0 bg-light-soft">
          <div class="d-flex align-items-center gap-4">
            <div class="avatar-circle-large" [style.background]="getAvatarColor(cliente.razon_social, 0.1)" [style.color]="getAvatarColor(cliente.razon_social, 1)">
              {{ getInitials(cliente) }}
            </div>
            <div>
              <h4 class="fw-bold mb-1">{{ cliente.razon_social }}</h4>
              <span class="badge" [ngClass]="cliente.activo ? 'badge-success' : 'badge-danger'">
                {{ cliente.activo ? 'Cliente Activo' : 'Cliente Inactivo' }}
              </span>
            </div>
          </div>
          <button class="btn-close" (click)="close()"></button>
        </div>

        <div class="modal-body py-4 scroll-custom">
          <div class="row g-4">
            <!-- Left Column: Details -->
            <div class="col-md-7">
              <div class="detail-section mb-4">
                <h6 class="text-uppercase text-muted fw-bold mb-3 small-tracking">Identificación Legal</h6>
                <div class="row g-3">
                  <div class="col-6">
                    <label class="detail-label">Tipo Documento</label>
                    <div class="detail-value text-uppercase">{{ cliente.tipo_identificacion }}</div>
                  </div>
                  <div class="col-6">
                    <label class="detail-label">Número</label>
                    <div class="detail-value fw-bold">{{ cliente.identificacion }}</div>
                  </div>
                  <div class="col-12" *ngIf="cliente.nombre_comercial">
                    <label class="detail-label">Nombre Comercial</label>
                    <div class="detail-value">{{ cliente.nombre_comercial }}</div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h6 class="text-uppercase text-muted fw-bold mb-3 small-tracking">Contacto & Ubicación</h6>
                <div class="row g-3">
                  <div class="col-12">
                    <label class="detail-label">Email Principal</label>
                    <div class="detail-value text-primary fw-semibold">{{ cliente.email }}</div>
                  </div>
                  <div class="col-6">
                    <label class="detail-label">Teléfono</label>
                    <div class="detail-value">{{ cliente.telefono || '—' }}</div>
                  </div>
                  <div class="col-6">
                    <label class="detail-label">Ciudad</label>
                    <div class="detail-value">{{ cliente.ciudad || '—' }}, {{ cliente.provincia || '—' }}</div>
                  </div>
                  <div class="col-12">
                    <label class="detail-label">Dirección</label>
                    <div class="detail-value small text-muted">{{ cliente.direccion || 'Sin dirección registrada' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Stats & Audit -->
            <div class="col-md-5">
              <div class="metric-card mb-4">
                <h6 class="text-white-50 fw-bold mb-3 small-tracking">Perfil Comercial</h6>
                <div class="d-flex flex-column gap-3">
                  <div class="metric-item">
                    <span class="metric-label">Límite de Crédito</span>
                    <span class="metric-value">{{ (cliente.limite_credito || 0) | currency }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">Plazo de Pago</span>
                    <span class="metric-value">{{ cliente.dias_credito || 0 }} Días</span>
                  </div>
                </div>
              </div>

              <div class="audit-card bg-light border-0">
                <h6 class="text-muted fw-bold mb-3 small-tracking">Auditoría</h6>
                <div class="d-flex flex-column gap-2 small">
                  <div class="d-flex justify-content-between">
                    <span class="text-muted">F. Registro</span>
                    <span class="fw-semibold">{{ cliente.created_at | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="d-flex justify-content-between" *ngIf="cliente.updated_at">
                    <span class="text-muted">Última mod.</span>
                    <span class="fw-semibold">{{ cliente.updated_at | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer border-0 pb-4 px-4">
          <button (click)="close()" class="btn btn-primary w-100 py-2 fw-bold">Cerrar Detalle</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1050; animation: fadeIn 0.2s; padding: 1rem; }
    .modal-content-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-height: 90vh; overflow: hidden; width: 100%; position: relative; display: flex; flex-direction: column; }
    
    .bg-light-soft { background: #f8fafc; padding: 2rem; }
    .avatar-circle-large { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; }
    
    .modal-body { overflow-y: auto; padding: 2rem; }
    
    .small-tracking { font-size: 0.7rem; letter-spacing: 1px; }
    .detail-label { font-size: 0.75rem; color: #94a3b8; font-weight: 700; margin-bottom: 0.2rem; display: block; }
    .detail-value { font-size: 0.95rem; color: #1e293b; font-weight: 600; }
    
    .metric-card { background: #1e293b; border-radius: 20px; padding: 1.5rem; color: white; }
    .metric-item { display: flex; flex-direction: column; }
    .metric-label { font-size: 0.65rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; }
    .metric-value { font-size: 1.5rem; font-weight: 800; }
    
    .audit-card { border-radius: 16px; padding: 1.25rem; }
    
    .badge { padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 700; font-size: 0.75rem; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    
    .btn-primary { background: #2563eb; border: none; border-radius: 12px; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .scroll-custom::-webkit-scrollbar { width: 4px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class ClienteDetailModalComponent implements OnInit, OnDestroy {
    @Input() cliente!: Cliente;
    @Output() onClose = new EventEmitter<void>();

    ngOnInit() {
        document.body.style.overflow = 'hidden';
    }

    ngOnDestroy() {
        document.body.style.overflow = 'auto';
    }

    getInitials(cliente: Cliente): string {
        if (!cliente.razon_social) return '??';
        return cliente.razon_social.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    close() {
        this.onClose.emit();
    }
}
