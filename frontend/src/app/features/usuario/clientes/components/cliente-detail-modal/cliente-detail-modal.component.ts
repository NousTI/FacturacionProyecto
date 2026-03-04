import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../../../../domain/models/cliente.model';

@Component({
    selector: 'app-cliente-detail-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-lux-container" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-lux-header">
          <div class="d-flex align-items-center gap-4">
            <div class="avatar-lux-large" [style.background]="getAvatarColor(cliente.razon_social, 0.1)" [style.color]="getAvatarColor(cliente.razon_social, 1)">
              {{ getInitials(cliente) }}
            </div>
            <div>
              <h2 class="modal-lux-title">{{ cliente.razon_social }}</h2>
              <div class="status-lux-badge mt-2" [class.activo]="cliente.activo">
                <span class="dot"></span>
                {{ cliente.activo ? 'Perfil Activo' : 'Perfil Suspendido' }}
              </div>
            </div>
          </div>
          <button (click)="close()" class="btn-close-lux">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-lux-body scroll-custom">
          
          <div class="row g-4">
            <!-- Información Principal -->
            <div class="col-md-7">
              <div class="lux-detail-section">
                <h3 class="lux-section-title">Identificación & Legal</h3>
                <div class="lux-info-grid">
                  <div class="lux-info-item">
                    <span class="lux-label">Tipo Documento</span>
                    <span class="lux-value">{{ cliente.tipo_identificacion }}</span>
                  </div>
                  <div class="lux-info-item">
                    <span class="lux-label">Nro. Identificación</span>
                    <span class="lux-value featured">{{ cliente.identificacion }}</span>
                  </div>
                  <div class="lux-info-item col-12" *ngIf="cliente.nombre_comercial">
                    <span class="lux-label">Nombre Comercial</span>
                    <span class="lux-value">{{ cliente.nombre_comercial }}</span>
                  </div>
                </div>
              </div>

              <div class="lux-detail-section mt-5">
                <h3 class="lux-section-title">Contacto & Ubicación</h3>
                <div class="lux-info-grid">
                  <div class="lux-info-item col-12">
                    <span class="lux-label">Correo Electrónico Principal</span>
                    <span class="lux-value email-lux">{{ cliente.email }}</span>
                  </div>
                  <div class="lux-info-item">
                    <span class="lux-label">Línea Telefónica</span>
                    <span class="lux-value">{{ cliente.telefono || 'Sin registro' }}</span>
                  </div>
                  <div class="lux-info-item">
                    <span class="lux-label">Ciudad de Residencia</span>
                    <span class="lux-value">{{ cliente.ciudad || 'N/A' }}</span>
                  </div>
                  <div class="lux-info-item col-12">
                    <span class="lux-label">Dirección de Facturación</span>
                    <span class="lux-value address-lux">{{ cliente.direccion || 'Sin dirección registrada' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Crédito y Auditoría -->
            <div class="col-md-5">
              <div class="lux-card-dark p-4">
                <h3 class="lux-section-title text-white-50 mb-4">Condiciones Comerciales</h3>
                <div class="d-flex flex-column gap-4">
                   <div class="lux-metric">
                      <span class="lux-metric-label">Límite de Crédito</span>
                      <span class="lux-metric-value">{{ (cliente.limite_credito || 0) | currency }}</span>
                   </div>
                   <div class="lux-metric">
                      <span class="lux-metric-label">Días de Crédito</span>
                      <span class="lux-metric-value">{{ cliente.dias_credito || 0 }} Días</span>
                   </div>
                   <div class="lux-metric">
                      <span class="lux-metric-label">Cartera Pendiente</span>
                      <span class="lux-metric-value text-info font-monospace">$ 0.00</span>
                   </div>
                </div>
              </div>

              <div class="lux-audit-section mt-4">
                <h3 class="lux-section-title">Registro & Auditoría</h3>
                <div class="lux-audit-card">
                  <div class="audit-row">
                    <span class="label">Creado en</span>
                    <span class="val">{{ cliente.created_at | date:'dd MMM, yyyy' }}</span>
                  </div>
                  <div class="audit-row" *ngIf="cliente.updated_at">
                    <span class="label">Última actualización</span>
                    <span class="val">{{ cliente.updated_at | date:'dd MMM, yyyy' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-lux-footer">
          <button (click)="close()" class="btn-lux-primary w-100">Entendido</button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.3); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 1rem;
    }

    .modal-lux-container {
      background: white;
      width: 820px;
      max-width: 95vw;
      max-height: 90vh;
      border-radius: 32px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 50px 100px -20px rgba(15, 23, 42, 0.25);
    }

    .modal-lux-header {
      padding: 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: linear-gradient(to bottom, #f8fafc, #ffffff);
      border-bottom: 1px solid #f1f5f9;
    }

    .avatar-lux-large {
      width: 72px;
      height: 72px;
      border-radius: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 800;
      box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-lux-title {
      font-size: 1.5rem;
      font-weight: 900;
      color: #1e293b;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .status-lux-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.85rem;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #64748b;
    }

    .status-lux-badge.activo { background: #f0fdf4; color: #16a34a; }
    .status-lux-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

    .btn-close-lux {
      background: white;
      border: 1px solid #e2e8f0;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-close-lux:hover {
      background: #f8fafc;
      color: #1e293b;
    }

    .modal-lux-body {
      padding: 2.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .lux-section-title {
      font-size: 0.8rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 1.5rem;
    }

    .lux-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }

    .lux-info-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .lux-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
    .lux-value { font-size: 1rem; font-weight: 700; color: #1e293b; }
    .lux-value.featured { color: #111827; font-size: 1.15rem; }
    .lux-value.email-lux { color: #2563eb; }

    .lux-card-dark {
      background: #111827;
      border-radius: 28px;
      color: white;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }

    .lux-metric { display: flex; flex-direction: column; gap: 0.25rem; }
    .lux-metric-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
    .lux-metric-value { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.5px; }

    .lux-audit-card {
      background: #f8fafc;
      border-radius: 20px;
      border: 1px solid #f1f5f9;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .audit-row { display: flex; justify-content: space-between; font-size: 0.8rem; }
    .audit-row .label { font-weight: 600; color: #64748b; }
    .audit-row .val { font-weight: 700; color: #1e293b; }

    .modal-lux-footer {
      padding: 2rem 2.5rem;
      background: white;
      border-top: 1px solid #f1f5f9;
    }

    .btn-lux-primary {
      background: #111827;
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 18px;
      font-weight: 800;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-lux-primary:hover {
      background: #1f2937;
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }

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
