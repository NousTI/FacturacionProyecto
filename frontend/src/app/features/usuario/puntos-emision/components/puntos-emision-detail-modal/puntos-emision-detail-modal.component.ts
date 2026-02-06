import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PuntoEmision } from '../../../../../domain/models/punto-emision.model';

@Component({
  selector: 'app-puntos-emision-detail-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">

        <!-- HEADER -->
        <div class="modal-header-final">
          <h2 class="modal-title-final">
            Detalles del Punto de Emisión
          </h2>
          <button (click)="close()" class="btn-close-final" type="button">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <!-- BODY -->
        <div class="modal-body-final scroll-custom">

          <!-- SECCIÓN: INFORMACIÓN BÁSICA -->
          <div class="form-section-final">
            <h3 class="section-header-final">Información Básica</h3>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="label-final">Código</label>
                <div class="detail-value">{{ puntoEmision.codigo }}</div>
              </div>
              <div class="col-md-8">
                <label class="label-final">Nombre del Punto de Emisión</label>
                <div class="detail-value">{{ puntoEmision.nombre }}</div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: ESTABLECIMIENTO -->
          <div class="form-section-final">
            <h3 class="section-header-final">Establecimiento Asociado</h3>
            <div class="row g-3">
              <div class="col-12">
                <label class="label-final">Nombre del Establecimiento</label>
                <div class="detail-value">{{ puntoEmision.establecimiento_nombre || 'No disponible' }}</div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: INFORMACIÓN DE SECUENCIAL -->
          <div class="form-section-final">
            <h3 class="section-header-final">Información del Secuencial</h3>
            <div class="row g-3">
              <div class="col-12">
                <label class="label-final">Próximo Secuencial a Usar (SRI)</label>
                <div class="detail-value" style="font-weight: 700; color: #10b981; font-size: 1.1rem;">
                  {{ ('000000000' + (puntoEmision.secuencial_actual || 0)).slice(-9) }}
                </div>
                <small style="color: #64748b;">Este valor se incrementará automáticamente con cada factura emitida</small>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: ESTADO Y AUDITORIA -->
          <div class="form-section-final border-0">
            <h3 class="section-header-final">Control y Auditoría</h3>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="label-final">Estado</label>
                <div class="detail-value">
                  <span class="badge-status-premium" [ngClass]="puntoEmision.activo ? 'activo' : 'inactivo'">
                    {{ puntoEmision.activo ? '🟢 ACTIVO' : '⚫ INACTIVO' }}
                  </span>
                </div>
              </div>
              <div class="col-md-6">
                <label class="label-final">ID del Punto</label>
                <div class="detail-value" style="font-family: monospace; font-size: 0.8rem;">
                  {{ puntoEmision.id | slice:0:13 }}...
                </div>
              </div>
              <div class="col-md-6">
                <label class="label-final">Creado</label>
                <div class="detail-value">{{ puntoEmision.created_at | date:'medium' }}</div>
              </div>
              <div class="col-md-6">
                <label class="label-final">Última Actualización</label>
                <div class="detail-value">{{ puntoEmision.updated_at | date:'medium' }}</div>
              </div>
            </div>
          </div>

        </div>

        <!-- FOOTER -->
        <div class="modal-footer-final">
          <button (click)="close()" class="btn-cancel-final" type="button">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 53, 0.4);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    }

    .modal-container-final {
      background: #ffffff;
      width: 700px;
      max-width: 95vw;
      max-height: 90vh;
      border-radius: 28px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header-final {
      padding: 1.5rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
    }

    .modal-title-final {
      font-size: 1.25rem;
      font-weight: 800;
      color: #161d35;
      margin: 0;
    }

    .btn-close-final {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
      transition: all 0.2s;
    }

    .btn-close-final:hover {
      color: #161d35;
      transform: rotate(90deg);
    }

    .modal-body-final {
      padding: 2rem 2.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .scroll-custom::-webkit-scrollbar {
      width: 6px;
    }

    .scroll-custom::-webkit-scrollbar-track {
      background: transparent;
    }

    .scroll-custom::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 3px;
    }

    .scroll-custom::-webkit-scrollbar-thumb:hover {
      background: #cbd5e1;
    }

    .form-section-final {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .form-section-final.border-0 {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-header-final {
      font-size: 1rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 1.25rem;
    }

    .label-final {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.5rem;
      display: block;
    }

    .detail-value {
      font-size: 0.95rem;
      color: #475569;
      font-weight: 600;
      padding: 0.75rem 0;
    }

    .badge-status-premium {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .badge-status-premium.activo {
      background: #ecfdf5;
      color: #10b981;
    }

    .badge-status-premium.inactivo {
      background: #fef2f2;
      color: #ef4444;
    }

    .modal-footer-final {
      padding: 1.25rem 2.5rem;
      background: #ffffff;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-cancel-final {
      background: #ffffff;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn-cancel-final:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #475569;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .modal-header-final,
      .modal-body-final,
      .modal-footer-final {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }

      .modal-title-final {
        font-size: 1.1rem;
      }

      .detail-value {
        font-size: 0.85rem;
      }
    }
  `]
})
export class PuntosEmisionDetailModalComponent {
  @Input() puntoEmision!: PuntoEmision;
  @Output() onClose = new EventEmitter<void>();

  close() {
    this.onClose.emit();
  }
}
