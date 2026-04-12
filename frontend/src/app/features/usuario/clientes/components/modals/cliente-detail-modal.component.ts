import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../../../../domain/models/cliente.model';

@Component({
  selector: 'app-cliente-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content-container shadow-lg" (click)="$event.stopPropagation()">
        
        <!-- Header Section -->
        <div class="detail-header">
          <div class="client-brand">
            <div class="avatar-large" [style.background]="getAvatarColor(cliente.razon_social, 0.1)" [style.color]="getAvatarColor(cliente.razon_social, 1)">
              {{ getInitials(cliente) }}
            </div>
            <div class="brand-text">
              <h4>{{ cliente.razon_social }}</h4>
              <div class="badges">
                <span class="status-badge" [ngClass]="cliente.activo ? 'active' : 'inactive'">
                  {{ cliente.activo ? 'Cliente Activo' : 'Cliente Inactivo' }}
                </span>
                <span class="type-badge" *ngIf="cliente.limite_credito > 0">Con Crédito</span>
              </div>
            </div>
          </div>
          <button class="btn-close-custom" (click)="close()">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body scroll-custom">
          <div class="row g-4">
            <!-- Left Info -->
            <div class="col-md-7">
              <div class="info-group">
                <div class="group-header">
                  <i class="bi bi-file-earmark-person"></i>
                  <span>Identificación Legal</span>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Tipo Documento</label>
                    <span class="text-uppercase">{{ cliente.tipo_identificacion }}</span>
                  </div>
                  <div class="info-item">
                    <label>Número</label>
                    <span class="fw-bold">{{ cliente.identificacion }}</span>
                  </div>
                  <div class="info-item full">
                    <label>Nombre Comercial</label>
                    <span>{{ cliente.nombre_comercial || 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <div class="info-group">
                <div class="group-header">
                  <i class="bi bi-geo-alt"></i>
                  <span>Contacto & Ubicación</span>
                </div>
                <div class="info-grid">
                  <div class="info-item full">
                    <label>Email Principal</label>
                    <span class="email-text">{{ cliente.email }}</span>
                  </div>
                  <div class="info-item">
                    <label>Teléfono</label>
                    <span>{{ cliente.telefono || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Ciudad / Provincia</label>
                    <span>{{ cliente.ciudad || '—' }}, {{ cliente.provincia || '—' }}</span>
                  </div>
                  <div class="info-item full">
                    <label>Dirección Fiscal</label>
                    <span class="address-text">{{ cliente.direccion || 'Sin dirección registrada' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="col-md-5">
              <div class="metric-card">
                <div class="card-title">Perfil Financiero</div>
                <div class="metric-item">
                  <span class="m-label">Límite de Crédito</span>
                  <span class="m-value">$ {{ (cliente.limite_credito || 0) | number:'1.2-2' }}</span>
                </div>
                <div class="metric-divider"></div>
                <div class="metric-item">
                  <span class="m-label">Plazo de Pago</span>
                  <span class="m-value">{{ cliente.dias_credito || 0 }} Días</span>
                </div>
              </div>

              <div class="audit-info">
                <div class="info-title">Registro & Auditoría</div>
                <div class="audit-row">
                  <span class="a-label">Fecha Creación</span>
                  <span class="a-value">{{ cliente.created_at | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="audit-row" *ngIf="cliente.updated_at">
                  <span class="a-label">Última Actualización</span>
                  <span class="a-value">{{ cliente.updated_at | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="close()" class="btn-primary-premium">Cerrar Detalle</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px); display: flex; align-items: center;
      justify-content: center; z-index: 10000; padding: 1rem;
    }
    .modal-content-container {
      background: white; border-radius: 28px;
      width: 100%; max-width: 850px; max-height: 90vh;
      display: flex; flex-direction: column; overflow: hidden;
      border: 1px solid #f1f5f9;
    }

    /* Header */
    .detail-header {
      padding: 2rem 2.5rem; background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
      display: flex; align-items: center; justify-content: space-between;
    }
    .client-brand { display: flex; align-items: center; gap: 1.5rem; }
    .avatar-large {
      width: 68px; height: 68px; border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 800;
    }
    .brand-text h4 { margin: 0 0 0.5rem 0; font-weight: 800; color: #1e293b; font-size: 1.5rem; }
    .badges { display: flex; gap: 0.5rem; }
    
    .status-badge {
      display: inline-flex; padding: 0.4rem 0.8rem; border-radius: 8px;
      font-size: 0.75rem; font-weight: 700;
    }
    .status-badge.active { background: #dcfce7; color: #166534; }
    .status-badge.inactive { background: #fee2e2; color: #991b1b; }
    
    .type-badge {
      background: #eff6ff; color: #1e40af; padding: 0.4rem 0.8rem; border-radius: 8px;
      font-size: 0.75rem; font-weight: 700;
    }

    .btn-close-custom {
      width: 36px; height: 36px; border-radius: 12px; border: none;
      background: white; color: #64748b; display: flex;
      align-items: center; justify-content: center; transition: all 0.2s;
    }
    .btn-close-custom:hover { background: #fee2e2; color: #ef4444; }

    /* Modal Body */
    .modal-body { padding: 2.5rem; overflow-y: auto; flex: 1; }
    
    .info-group { margin-bottom: 2.5rem; }
    .group-header {
      display: flex; align-items: center; gap: 0.75rem;
      margin-bottom: 1.25rem; color: #475569;
    }
    .group-header i { font-size: 1.1rem; color: #3b82f6; }
    .group-header span { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.3rem; }
    .info-item.full { grid-column: span 2; }
    .info-item label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .info-item span { font-size: 1rem; font-weight: 600; color: #1e293b; }
    .email-text { color: #2563eb !important; text-decoration: underline; }
    .address-text { font-size: 0.9rem !important; color: #64748b !important; line-height: 1.5; }

    /* Right Column - Metric Card */
    .metric-card {
      background: #1e293b; border-radius: 24px; padding: 2rem; color: white;
      margin-bottom: 2rem; box-shadow: 0 10px 25px -5px rgba(30, 41, 59, 0.4);
    }
    .card-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 1.5rem; letter-spacing: 0.05em; }
    .metric-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .m-label { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }
    .m-value { font-size: 2rem; font-weight: 900; letter-spacing: -0.02em; }
    .metric-divider { height: 1px; background: rgba(255, 255, 255, 0.1); margin: 1.5rem 0; }

    .audit-info { background: #f8fafc; border-radius: 20px; padding: 1.5rem; border: 1px solid #f1f5f9; }
    .info-title { font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-bottom: 1rem; text-transform: uppercase; }
    .audit-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .audit-row:last-child { margin-bottom: 0; }
    .a-label { font-size: 0.8rem; font-weight: 600; color: #64748b; }
    .a-value { font-size: 0.8rem; font-weight: 700; color: #1e293b; }

    .modal-footer { padding: 1.5rem 2.5rem; }
    .btn-primary-premium {
      width: 100%; padding: 1rem; border-radius: 16px; border: none;
      background: #1e293b; color: white; font-weight: 800; font-size: 1rem;
      transition: all 0.2s;
    }
    .btn-primary-premium:hover { background: #0f172a; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }

    .scroll-custom::-webkit-scrollbar { width: 6px; }
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
