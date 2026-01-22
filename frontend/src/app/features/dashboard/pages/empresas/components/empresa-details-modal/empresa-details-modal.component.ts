import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-empresa-details-modal',
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-details-premium">
              {{ empresa?.razonSocial?.substring(0, 2).toUpperCase() }}
            </div>
            <div>
              <h2 class="modal-title-final">{{ empresa?.razonSocial }}</h2>
              <span class="badge-status-details" [ngClass]="empresa?.estado === 'ACTIVO' ? 'active' : 'inactive'">
                {{ empresa?.estado }}
              </span>
            </div>
          </div>
          <button (click)="onClose.emit()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          
          <!-- SECCIÓN: INFORMACIÓN LEGAL -->
          <div class="form-section-final">
            <h3 class="section-header-final">Información Legal</h3>
            <div class="row g-3">
              <div class="col-12">
                <label class="label-final">Razón Social</label>
                <div class="value-display-premium">{{ empresa?.razonSocial }}</div>
              </div>
              <div class="col-md-6">
                <label class="label-final">Nombre Comercial</label>
                <div class="value-display-premium" [class.no-data]="!empresa?.nombreComercial">
                  {{ empresa?.nombreComercial || 'Sin nombre comercial registrado' }}
                </div>
              </div>
              <div class="col-md-6">
                <label class="label-final">RUC</label>
                <div class="value-display-premium font-mono">{{ empresa?.ruc }}</div>
              </div>
              <div class="col-12">
                <label class="label-final">Tipo de Contribuyente</label>
                <div class="value-display-premium">{{ empresa?.tipoContribuyente || 'Régimen General' }}</div>
              </div>
              <div class="col-12">
                <label class="label-final">Dirección Principal</label>
                <div class="value-display-premium" [class.no-data]="!empresa?.direccion">
                  {{ empresa?.direccion || 'Sin dirección principal registrada' }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: CONTACTO -->
          <div class="form-section-final">
            <h3 class="section-header-final">Información de Contacto</h3>
            <div class="row g-3">
              <div class="col-md-7">
                <label class="label-final">Correo Electrónico</label>
                <div class="value-display-premium text-corporate">{{ empresa?.email || 'S/D' }}</div>
              </div>
              <div class="col-md-5">
                <label class="label-final">Teléfono</label>
                <div class="value-display-premium" [class.no-data]="!empresa?.telefono">
                  {{ empresa?.telefono || 'Sin teléfono registrado' }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: SISTEMA -->
          <div class="form-section-final border-0 mb-0 pb-0">
            <h3 class="section-header-final text-corporate">Información del Sistema</h3>
            <div class="system-card-premium">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-final">ID de Registro</label>
                  <div class="value-display-premium font-mono">#{{ (empresa?.id || 0).toString().padStart(4, '0') }}</div>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Plan Actual</label>
                  <div class="value-display-premium fw-bold text-corporate">{{ empresa?.plan }}</div>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Fecha de Registro</label>
                  <div class="value-display-premium">{{ (empresa?.fechaRegistro || empresa?.fechaVencimiento) | date:'dd MMM, yyyy' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Vencimiento</label>
                  <div class="value-display-premium text-danger fw-bold">{{ empresa?.fechaVencimiento | date:'dd/MM/yyyy' }}</div>
                </div>
                <div class="col-12">
                  <label class="label-final">Vendedor Asignado</label>
                  <div class="value-display-premium">
                    <i class="bi bi-briefcase me-2 text-muted"></i>
                    {{ empresa?.vendedorName || 'Gestión Directa por Superadmin' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="onClose.emit()" class="btn-cancel-final">Cerrar</button>
          <button (click)="onClose.emit()" class="btn-submit-final">Aceptar</button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10005;
      padding: 1rem;
    }
    .modal-container-final {
      background: #ffffff; width: 780px; height: 680px;
      max-width: 95vw; max-height: 90vh; border-radius: 28px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final { padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center; }
    .modal-title-final { font-size: 1.25rem; font-weight: 800; color: #161d35; margin: 0; }
    .btn-close-final { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    
    .avatar-details-premium {
      width: 44px; height: 44px; background: #161d35; color: white;
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1rem;
    }
    .badge-status-details {
      font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.85rem; border-radius: 100px;
      text-transform: uppercase; margin-top: 0.25rem; display: inline-block;
    }
    .badge-status-details.active { background: #e0e7ff; color: #161d35; } 
    .badge-status-details.inactive { background: #f1f5f9; color: #94a3b8; }

    .modal-body-final { padding: 0 2.5rem 2rem; overflow-y: auto; flex: 1; }
    .form-section-final { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #f1f5f9; }
    .section-header-final { font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem; }
    .label-final { font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 0.6rem; display: block; }
    
    .value-display-premium {
      width: 100%; background: #f8fafc; border: 1px solid #f1f5f9;
      border-radius: 100px; padding: 0.65rem 1.5rem;
      font-size: 0.9rem; color: #1e293b; font-weight: 600;
    }
    .value-display-premium.no-data {
      color: #f97316; /* Naranja para datos faltantes */
      font-style: italic;
      background: #fffaf5;
      border-color: #ffedd5;
    }
    
    .system-card-premium {
      background: #fbfcfe; padding: 1.5rem; border-radius: 24px;
      border: 1px solid #f1f5f9;
    }

    .text-corporate { color: #161d35 !important; }
    .text-danger { color: #ef4444 !important; }
    
    .font-mono { font-family: 'DM Mono', monospace; letter-spacing: -0.5px; }
    .modal-footer-final {
      padding: 1.5rem 2.5rem; background: #ffffff;
      display: flex; justify-content: flex-end; gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-submit-final {
      background: #161d35; color: #ffffff; border: none;
      padding: 0.75rem 2.5rem; border-radius: 12px; font-weight: 700;
      transition: all 0.2s;
    }
    .btn-cancel-final {
      background: #ffffff; color: #64748b; border: 1px solid #e2e8f0;
      padding: 0.75rem 2rem; border-radius: 12px; font-weight: 600;
    }
    
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `],
    standalone: true,
    imports: [CommonModule]
})
export class EmpresaDetailsModalComponent {
    @Input() empresa: any;
    @Output() onClose = new EventEmitter<void>();
}
