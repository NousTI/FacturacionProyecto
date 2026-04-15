import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Factura } from '../../../../../domain/models/factura.model';
import { UiService } from '../../../../../shared/services/ui.service';
import { PermissionsService } from '../../../../../core/auth/permissions.service';
import { FACTURAS_PERMISSIONS } from '../../../../../constants/permission-codes';
import { NotasCreditoService } from '../../services/notas-credito.service';
import { ResultadoEmisionNC } from '../../../../../domain/models/nota-credito.model';
import { PremiumAlertComponent } from '../../../../../shared/components/premium-alert/premium-alert.component';

@Component({
  selector: 'app-anular-factura-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PremiumAlertComponent],
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
            <button type="button" class="btn-close-lux" (click)="close.emit(false)" [disabled]="loading">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body p-4">
            <!-- Factura Info (Always visible for context) -->
            <div class="invoice-summary-card mb-4" *ngIf="factura && !resultadoSri">
               <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span class="text-muted small fw-bold text-uppercase d-block mb-1">Comprobante</span>
                    <h5 class="fw-900 text-dark mb-0">{{ factura.numero_factura }}</h5>
                  </div>
                  <div class="text-end">
                    <span class="text-muted small fw-bold text-uppercase d-block mb-1">Monto a Reversar</span>
                    <h5 class="fw-900 text-primary mb-0">{{ factura.total | currency:'USD' }}</h5>
                  </div>
               </div>
               
               <div class="info-row d-flex gap-3 pt-2 border-top">
                  <div class="flex-grow-1">
                    <span class="text-muted small d-block">Cliente</span>
                    <span class="fw-bold small text-dark">{{ factura.snapshot_cliente?.razon_social }}</span>
                  </div>
                  <div>
                    <span class="text-muted small d-block">Identificación</span>
                    <span class="fw-bold small text-dark">{{ factura.snapshot_cliente?.identificacion }}</span>
                  </div>
               </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading" class="text-center py-5">
               <div class="loading-lux mb-3">
                  <div class="spinner-premium"></div>
               </div>
               <h5 class="fw-900 text-dark mb-1">Procesando Anulación</h5>
               <p class="text-muted small">Comunicando con el SRI, por favor espere...</p>
            </div>

            <ng-container *ngIf="!loading && !resultadoSri">
               <!-- Motivo y Acción -->
               <div class="form-section animate__animated animate__fadeIn">
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
                     <small>Se generará una <b>Nota de Crédito</b> electrónica asociada para legalizar la anulación.</small>
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
            </ng-container>

            <!-- Result State -->
            <div *ngIf="resultadoSri && !loading" class="result-container py-2 animate__animated animate__fadeIn">
               <app-premium-alert
                  [type]="resultadoSri.resultado_sri.estado === 'AUTORIZADO' ? 'success' : 'warning'"
                  [icon]="resultadoSri.resultado_sri.estado === 'AUTORIZADO' ? 'bi-check-all' : 'bi-exclamation-triangle'"
                  [title]="resultadoSri.resultado_sri.estado === 'AUTORIZADO' ? '¡Anulación Exitosa!' : 'Resultado SRI'"
                  [message]="resultadoSri.resultado_sri.estado === 'AUTORIZADO' 
                    ? 'La factura ' + factura.numero_factura + ' ha sido anulada legalmente ante el SRI.' 
                    : 'El SRI recibió el comprobante ' + factura.numero_factura + ' pero devolvió observaciones.'"
               ></app-premium-alert>

               <div class="alert bg-soft-light border-0 p-3 rounded-4 mt-3 text-start mb-4" *ngIf="resultadoSri.resultado_sri.mensajes?.length">
                  <span class="d-block fw-bold small text-muted text-uppercase mb-2">Detalles Técnicos:</span>
                  <ul class="ps-3 mb-0 small text-dark">
                    <li *ngFor="let m of resultadoSri.resultado_sri.mensajes" class="mb-1 fw-500">{{ m }}</li>
                  </ul>
               </div>

               <button class="btn btn-dark-lux w-100 py-3 rounded-4 fw-bold shadow-sm mt-2" (click)="close.emit(true)">
                 Entendido, Continuar
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .fw-900 { font-weight: 900; }
    .fw-500 { font-weight: 500; }
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
    .btn-close-lux:hover:not(:disabled) { background: #e2e8f0; color: #1e293b; }

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

    .btn-dark-lux {
      background: #1e293b;
      color: white;
      border: none;
      transition: all 0.2s;
    }
    .btn-dark-lux:hover {
      background: #0f172a;
      transform: translateY(-1px);
    }
    .bg-soft-light { background: #f8fafc; }

    .success-icon-wrapper {
      width: 80px;
      height: 80px;
      background: #ecfdf5;
      color: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3.5rem;
      margin: 0 auto;
      box-shadow: 0 0 0 10px #f0fdf4;
      animation: pulse-success 2s infinite;
    }

    @keyframes pulse-success {
      0% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.2); }
      70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); }
    }
  `]
})
export class AnularFacturaModalComponent implements OnInit {
  @Input() factura!: Factura;
  @Output() close = new EventEmitter<boolean>();

  razon: string = '';
  loading: boolean = false;
  resultadoSri: ResultadoEmisionNC | null = null;

  constructor(
    private uiService: UiService,
    private permissionsService: PermissionsService,
    private ncService: NotasCreditoService
  ) {}

  ngOnInit() {
    if (!this.permissionsService.hasPermission(FACTURAS_PERMISSIONS.ANULAR)) {
      this.uiService.showToast('No tienes permisos para anular facturas', 'warning');
      this.close.emit(false);
    }
  }

  get canAnular(): boolean {
    return this.permissionsService.hasPermission(FACTURAS_PERMISSIONS.ANULAR);
  }

  onAnular() {
    if (!this.permissionsService.hasPermission(FACTURAS_PERMISSIONS.ANULAR)) {
      this.uiService.showError('Permiso denegado: No puedes anular facturas', 'error');
      return;
    }

    if (!this.razon.trim()) {
      this.uiService.showToast('Debe ingresar un motivo de anulación', 'warning');
      return;
    }

    this.loading = true;
    this.ncService.anularFacturaConNC(this.factura.id, this.razon).subscribe({
      next: (res) => {
        this.loading = false;
        this.resultadoSri = res;
        
        if (res.resultado_sri.estado === 'AUTORIZADO') {
          this.uiService.showToast('Factura anulada exitosamente', 'success');
        } else {
          this.uiService.showToast('El SRI devolvió observaciones en la anulación', 'warning');
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.detail || 'Error al intentar anular la factura';
        this.uiService.showError(msg);
      }
    });
  }
}
