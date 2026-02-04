import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../../../../domain/models/cliente.model';

@Component({
    selector: 'app-cliente-detail-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-badge">
              {{ getInitials(cliente) }}
            </div>
            <div>
              <h2 class="modal-title-final">{{ cliente.razon_social }}</h2>
              <span class="badge-status" [class.active]="cliente.activo">
                {{ cliente.activo ? 'Cliente Activo' : 'Cliente Inactivo' }}
              </span>
            </div>
          </div>
          <button (click)="close()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          
          <div class="row g-4">
            <!-- Columna Izquierda: Información Principal -->
            <div class="col-md-7">
              <div class="detail-section">
                <h3 class="section-title"><i class="bi bi-person-badge me-2"></i> Identificación & Legal</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Tipo Documento</span>
                    <span class="info-value">{{ cliente.tipo_identificacion }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Nro. Identificación</span>
                    <span class="info-value highlighted">{{ cliente.identificacion }}</span>
                  </div>
                  <div class="info-item col-12" *ngIf="cliente.nombre_comercial">
                    <span class="info-label">Nombre Comercial</span>
                    <span class="info-value">{{ cliente.nombre_comercial }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section mt-4">
                <h3 class="section-title"><i class="bi bi-geo-alt me-2"></i> Ubicación & Contacto</h3>
                <div class="info-grid">
                  <div class="info-item col-12">
                    <span class="info-label">Correo Electrónico</span>
                    <span class="info-value text-primary fw-bold">{{ cliente.email }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Teléfono</span>
                    <span class="info-value">{{ cliente.telefono || 'No registrado' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Ciudad</span>
                    <span class="info-value">{{ cliente.ciudad || 'N/A' }}</span>
                  </div>
                  <div class="info-item col-12">
                    <span class="info-label">Dirección Fiscal</span>
                    <span class="info-value">{{ cliente.direccion || 'Sin dirección registrada' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Provincia</span>
                    <span class="info-value">{{ cliente.provincia || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">País</span>
                    <span class="info-value">{{ cliente.pais || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Crédito y Auditoría -->
            <div class="col-md-5">
              <div class="card-premium-dark p-4">
                <h3 class="section-title text-white mb-4"><i class="bi bi-credit-card me-2"></i> Condiciones Comerciales</h3>
                <div class="d-flex flex-column gap-4">
                  <div class="metric-item">
                    <span class="metric-label text-white-50">Límite de Crédito</span>
                    <span class="metric-value text-white">{{ (cliente.limite_credito || 0) | currency }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label text-white-50">Días de Crédito</span>
                    <span class="metric-value text-white">{{ cliente.dias_credito || 0 }} Días</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label text-white-50">Saldo Pendiente</span>
                    <span class="metric-value text-info font-monospace">$ 0.00</span>
                  </div>
                </div>
              </div>

              <div class="audit-section mt-4">
                <h3 class="section-title"><i class="bi bi-clock-history me-2"></i> Auditoría</h3>
                <div class="audit-list">
                  <div class="audit-item">
                    <span class="audit-label">Fecha Registro</span>
                    <span class="audit-value">{{ cliente.created_at | date:'medium' }}</span>
                  </div>
                  <div class="audit-item" *ngIf="cliente.updated_at">
                    <span class="audit-label">Última Modificación</span>
                    <span class="audit-value">{{ cliente.updated_at | date:'medium' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="close()" class="btn-primary-final px-5">Entendido</button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 1rem;
    }
    .modal-container-final {
      background: #ffffff; width: 850px;
      max-width: 95vw; max-height: 90vh; border-radius: 32px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 50px 100px -20px rgba(15, 23, 42, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .modal-header-final {
      padding: 2.5rem; display: flex; justify-content: space-between; align-items: flex-start;
      background: linear-gradient(to bottom, #f8fafc, #ffffff);
    }
    .avatar-badge {
      width: 64px; height: 64px; background: #161d35; color: white;
      border-radius: 20px; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 800; box-shadow: 0 10px 20px rgba(22, 29, 53, 0.15);
    }
    .modal-title-final {
      font-size: 1.5rem; font-weight: 900; color: #1e293b; margin: 0;
    }
    .badge-status {
      display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; 
      font-weight: 700; margin-top: 6px; background: #f1f5f9; color: #64748b;
    }
    .badge-status.active { background: #dcfce7; color: #166534; }
    
    .btn-close-final {
      background: white; border: 1px solid #e2e8f0; width: 44px; height: 44px;
      border-radius: 14px; font-size: 1.5rem; color: #94a3b8; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .btn-close-final:hover { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }

    .modal-body-final {
      padding: 0 2.5rem 2.5rem; overflow-y: auto; flex: 1;
    }

    .section-title {
      font-size: 0.85rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 1.5rem;
    }

    .info-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;
    }
    .info-item {
      display: flex; flex-direction: column; gap: 0.25rem;
    }
    .info-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
    .info-value { font-size: 1rem; font-weight: 700; color: #1e293b; }
    .info-value.highlighted { color: #161d35; font-size: 1.1rem; }

    .card-premium-dark {
      background: #1e293b; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .metric-item { display: flex; flex-direction: column; }
    .metric-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem; }
    .metric-value { font-size: 1.5rem; font-weight: 800; }

    .audit-list { display: flex; flex-direction: column; gap: 1rem; }
    .audit-item { display: flex; justify-content: space-between; align-items: center; 
      padding: 12px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
    .audit-label { font-size: 0.75rem; font-weight: 600; color: #64748b; }
    .audit-value { font-size: 0.8rem; font-weight: 700; color: #1e293b; }

    .modal-footer-final {
      padding: 1.5rem 2.5rem; background: white; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: center;
    }
    .btn-primary-final {
      background: #161d35; color: white; border: none; padding: 1rem 3rem; 
      border-radius: 16px; font-weight: 800; transition: all 0.2s;
    }
    .btn-primary-final:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }

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

    close() {
        this.onClose.emit();
    }
}
