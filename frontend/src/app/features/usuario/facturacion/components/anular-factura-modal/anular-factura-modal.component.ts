import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Factura } from '../../../../../domain/models/factura.model';
import { UiService } from '../../../../../shared/services/ui.service';
import { PermissionsService } from '../../../../../core/auth/permissions.service';
import { FACTURAS_PERMISSIONS } from '../../../../../constants/permission-codes';

@Component({
  selector: 'app-anular-factura-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop fade show" style="display: block; background-color: rgba(0,0,0,0.4); backdrop-filter: blur(4px);"></div>
    <div class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          
          <!-- Header -->
          <div class="modal-header border-0 p-4 pb-0 d-flex justify-content-between align-items-start">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <div class="icon-badge bg-soft-danger text-danger">
                  <i class="bi bi-x-circle-fill"></i>
                </div>
                <h5 class="fw-900 mb-0 text-dark" style="letter-spacing: -0.5px;">Anular Factura</h5>
              </div>
              <p class="text-muted small mb-0">Esta acción solicitará la anulación del comprobante ante el SRI.</p>
            </div>
            <button type="button" class="btn-close-lux" (click)="close.emit(false)">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body p-4">
            <!-- Factura Info -->
            <div class="invoice-summary-card mb-4">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <span class="d-block text-muted tiny-cap">Comprobante</span>
                  <span class="fw-bold text-dark">{{ factura.numero_factura }}</span>
                </div>
                <div class="text-end">
                  <span class="d-block text-muted tiny-cap">Total a Reversar</span>
                  <span class="fw-bold text-danger">{{ factura.total | currency:'USD' }}</span>
                </div>
              </div>
            </div>

            <!-- Reason Field -->
            <div class="form-group mb-4">
              <label class="form-label-lux">Motivo de Anulación</label>
              <textarea 
                class="input-lux" 
                [(ngModel)]="razon" 
                placeholder="Escriba el motivo por el cual desea anular este comprobante..."
                rows="3"
                style="resize: none; padding-left: 1rem;"
              ></textarea>
              <div class="alert alert-info-lux mt-3 d-flex align-items-start gap-2">
                <i class="bi bi-info-circle-fill flex-shrink-0 mt-1"></i>
                <small>Recuerde que una vez anulada, la factura no podrá ser recuperada y el secuencial quedará invalidado.</small>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-3">
              <button
                class="btn btn-light-lux flex-grow-1"
                (click)="close.emit(false)"
              >
                Cancelar
              </button>
              <button
                class="btn btn-danger-lux flex-grow-1"
                [disabled]="!razon.trim() || !canAnular"
                [title]="!canAnular ? 'No tienes permisos para anular facturas' : ''"
                (click)="onAnular()"
              >
                <i class="bi bi-x-circle me-1"></i>
                Confirmar Anulación
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .fw-900 { font-weight: 900; }
    .tiny-cap { text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.5px; font-weight: 700; }
    
    .icon-badge {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    .bg-soft-danger { background: #fef2f2; }

    .btn-close-lux {
      background: #f1f5f9;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
    }
    .btn-close-lux:hover { background: #e2e8f0; color: #1e293b; }

    .invoice-summary-card {
      background: #fffafa;
      border: 1px dashed #fca5a5;
      border-radius: 16px;
      padding: 1rem 1.25rem;
    }

    .form-label-lux {
      font-size: 0.75rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
      display: block;
    }

    .input-lux {
      width: 100%;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      outline: none;
      transition: all 0.2s;
    }
    .input-lux:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.05);
    }

    .alert-info-lux {
      background: #f0f9ff;
      border: 1px solid #e0f2fe;
      border-radius: 12px;
      padding: 0.75rem;
      color: #0369a1;
      font-weight: 500;
      line-height: 1.4;
    }

    .btn-danger-lux {
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.85rem;
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .btn-danger-lux:hover:not(:disabled) {
      background: #dc2626;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    }
    .btn-danger-lux:disabled {
      background: #fca5a5;
      cursor: not-allowed;
    }

    .btn-light-lux {
      background: #f1f5f9;
      color: #475569;
      border: none;
      padding: 0.85rem;
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .btn-light-lux:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
  `]
})
export class AnularFacturaModalComponent implements OnInit {
  @Input() factura!: Factura;
  @Output() close = new EventEmitter<boolean>();

  razon: string = '';

  constructor(
    private uiService: UiService,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    // VALIDACIÓN 1: Guardia - Verificar permiso de anular
    if (!this.permissionsService.hasPermission(FACTURAS_PERMISSIONS.ANULAR)) {
      this.uiService.showToast('No tienes permisos para anular facturas', 'warning');
      this.close.emit(false);
    }
  }

  // VALIDACIÓN 3: UX - Getter para deshabilitación de botón
  get canAnular(): boolean {
    return this.permissionsService.hasPermission(FACTURAS_PERMISSIONS.ANULAR);
  }

  onAnular() {
    // VALIDACIÓN 2: Doble verificación antes de procesar
    if (!this.permissionsService.hasPermission(FACTURAS_PERMISSIONS.ANULAR)) {
      this.uiService.showError('Permiso denegado: No puedes anular facturas', 'error');
      return;
    }

    this.uiService.showToast(
      'Estimado usuario, este proceso se encuentra actualmente en fase de implementación.',
      'info',
      'Estamos trabajando para habilitar la anulación directa en los próximos días.',
      6000
    );
    // Para que el modal no se quede abierto eternamente si el usuario quiere,
    // pero usualmente estos "moks" cierran el modal después de la notificación.
    setTimeout(() => {
      this.close.emit(false);
    }, 2000);
  }
}
