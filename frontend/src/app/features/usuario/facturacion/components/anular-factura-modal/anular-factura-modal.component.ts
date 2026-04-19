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
    <!-- Backdrop Estático (No se cierra al clickear) -->
    <div class="modal-backdrop-premium fade show"></div>
    
    <div class="modal fade show" style="display: block;" tabindex="-1">
      <!-- El click en el diálogo NO emite cierre, logrando el backdrop estático -->
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden animate__animated animate__zoomIn animate__faster">
          
          <!-- Header -->
          <div class="modal-header border-0 p-4 pb-0 d-flex justify-content-between align-items-start">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <div class="icon-badge bg-soft-danger text-danger">
                  <i class="bi bi-x-circle-fill"></i>
                </div>
                <h5 class="fw-900 mb-0 text-dark" style="letter-spacing: -0.5px;">Anular Factura</h5>
              </div>
              <p class="text-muted small mb-0">Esta acción solicitará la anulación legal ante el SRI.</p>
            </div>
            <button type="button" class="btn-close-lux" (click)="close.emit(false)" [disabled]="loading">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="modal-body p-4">
            <!-- Factura Info (Contexto) -->
            <div class="invoice-summary-card mb-4" *ngIf="factura && !resultadoSri && !loading">
               <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span class="text-muted small fw-bold text-uppercase d-block mb-1">Comprobante</span>
                    <h5 class="fw-900 text-dark mb-0">{{ factura.numero_factura }}</h5>
                  </div>
                  <div class="text-end">
                    <span class="text-muted small fw-bold text-uppercase d-block mb-1">Total Factura</span>
                    <h5 class="fw-900 text-dark mb-0">{{ factura.total | currency:'USD' }}</h5>
                  </div>
               </div>
               
               <div class="info-row d-flex gap-3 pt-2 border-top">
                  <div class="flex-grow-1">
                    <span class="text-muted small d-block">Cliente</span>
                    <span class="fw-bold small text-dark">{{ factura.snapshot_cliente?.razon_social }}</span>
                  </div>
               </div>
            </div>

            <!-- ── ESTADO: CARGANDO (Spinner Prominente) ── -->
            <div *ngIf="loading" class="text-center py-5 animate__animated animate__fadeIn">
               <div class="loading-lux mb-4">
                  <div class="spinner-premium-lg"></div>
               </div>
               <h4 class="fw-900 text-dark mb-2">Procesando Anulación</h4>
               <p class="text-muted px-4">Estamos comunicándonos con los servidores del SRI para autorizar la Nota de Crédito. No cierre esta ventana.</p>
            </div>

            <!-- ── ESTADO: FORMULARIO ── -->
            <ng-container *ngIf="!loading && !resultadoSri">
               <div class="form-section animate__animated animate__fadeIn">
                 <div class="form-group mb-4">
                   <label class="form-label-lux">Motivo de Anulación *</label>
                   <textarea 
                     class="input-lux" 
                     [(ngModel)]="razon" 
                     placeholder="Ej: Error en datos del cliente, devolución de mercadería..."
                     rows="3"
                     style="resize: none;"
                   ></textarea>
                   <div class="alert alert-info-lux mt-3 d-flex align-items-start gap-2">
                     <i class="bi bi-info-circle-fill flex-shrink-0 mt-1"></i>
                     <small>Para anular una factura AUTORIZADA, la ley requiere generar una <b>Nota de Crédito</b> electrónica.</small>
                   </div>
                 </div>
  
                 <div class="d-flex gap-3">
                   <button class="btn btn-light-lux flex-grow-1" (click)="close.emit(false)">Cancelar</button>
                   <button
                     class="btn btn-danger-lux flex-grow-1"
                     [disabled]="!razon.trim() || !canAnular"
                     (click)="onAnular()"
                   >
                     <i class="bi bi-check-circle me-1"></i> Confirmar
                   </button>
                 </div>
               </div>
            </ng-container>

            <!-- ── ESTADO: RESULTADO (Éxito / Observaciones) ── -->
            <div *ngIf="resultadoSri && !loading" class="result-container text-center animate__animated animate__fadeInUp">
                
                <!-- Icono de Éxito Gigante (Resiliente a género/mayúsculas) -->
                <div class="success-icon-wrapper mb-4" *ngIf="estadoSri.includes('AUTORIZA')">
                   <i class="bi bi-check-lg"></i>
                </div>

                <div class="alert-box" [class.success]="estadoSri.includes('AUTORIZA')" 
                                      [class.warning]="!estadoSri.includes('AUTORIZA')">
                  <h5 class="fw-900 mb-2">
                    {{ estadoSri.includes('AUTORIZA') ? '¡Factura Anulada con Éxito!' : 'Resultado SRI' }}
                  </h5>
                  <p class="mb-0 small">
                    {{ estadoSri.includes('AUTORIZA') 
                      ? 'Se ha generado y autorizado la Nota de Crédito correctamente. La factura ' + (factura?.numero_factura || '') + ' ya no es válida legalmente.' 
                      : 'El SRI recibió la solicitud pero devolvió observaciones o un estado no esperado: ' + estadoSri }}
                  </p>
                </div>

                <div class="technical-details mt-4 text-start" *ngIf="mensajesSri.length">
                   <span class="tiny-cap text-muted mb-2 d-block">Mensajes del SRI:</span>
                   <div class="msg-list p-3 bg-light rounded-3">
                      <div *ngFor="let m of mensajesSri" class="small mb-1 d-flex gap-2">
                         <i class="bi bi-dot"></i> <span>{{ m }}</span>
                      </div>
                   </div>
                </div>

                <button class="btn btn-dark-lux w-100 py-3 rounded-4 fw-bold shadow-sm mt-4" (click)="close.emit(true)">
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
    .tiny-cap { text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.5px; font-weight: 700; }
    
    .modal-backdrop-premium {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px);
      z-index: 1040;
    }

    .icon-badge {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .bg-soft-danger { background: #fef2f2; }

    .btn-close-lux {
      background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s;
    }
    .btn-close-lux:hover:not(:disabled) { background: #e2e8f0; color: black; }

    .invoice-summary-card {
      background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 1.25rem;
    }

    .form-label-lux {
      font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 0.5rem; display: block;
    }

    .input-lux {
      width: 100%; border: 2px solid #e2e8f0; border-radius: 14px; padding: 0.75rem 1rem;
      font-size: 0.95rem; font-weight: 600; outline: none; transition: all 0.2s;
    }
    .input-lux:focus { border-color: #ef4444; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.05); }

    .alert-info-lux {
      background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 12px;
      padding: 0.75rem; color: #0369a1; font-weight: 500; font-size: 0.85rem;
    }

    .btn-danger-lux {
      background: #ef4444; color: white; border: none; padding: 0.85rem;
      border-radius: 14px; font-weight: 700; transition: all 0.2s;
    }
    .btn-danger-lux:hover:not(:disabled) { background: #dc2626; transform: translateY(-1px); }
    .btn-danger-lux:disabled { background: #fca5a5; cursor: not-allowed; }

    .btn-light-lux {
      background: #f1f5f9; color: #475569; border: none; padding: 0.85rem;
      border-radius: 14px; font-weight: 700; transition: all 0.2s;
    }

    .btn-dark-lux {
      background: var(--primary-color); color: white; border: none; transition: all 0.2s;
    }

    /* Animation Wrapper Success */
    .success-icon-wrapper {
      width: 80px; height: 80px; background: #ecfdf5; color: #10b981; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 3rem;
      margin: 0 auto; box-shadow: 0 0 0 10px #f0fdf4;
      animation: checkBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes checkBounce {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .alert-box { padding: 1.5rem; border-radius: 20px; }
    .alert-box.success { background: #ecfdf5; color: #065f46; border: 1px solid #d1fae5; }
    .alert-box.warning { background: #fffbeb; color: #92400e; border: 1px solid #fef3c7; }

    /* Spinner Lg */
    .spinner-premium-lg {
      width: 60px; height: 60px; border: 4px solid #f1f5f9;
      border-top: 4px solid #ef4444; border-radius: 50%;
      animation: spin 1s linear infinite; margin: 0 auto;
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .loading-lux { height: 80px; display: flex; align-items: center; }
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

  get estadoSri(): string {
    // Manejo resiliente de la respuesta envuelta en 'detalles' por success_response
    const res: any = this.resultadoSri;
    const info = res?.detalles?.resultado_sri || res?.resultado_sri;
    return (info?.estado || '').toUpperCase();
  }

  get mensajesSri(): string[] {
    const res: any = this.resultadoSri;
    const info = res?.detalles?.resultado_sri || res?.resultado_sri;
    return info?.mensajes || [];
  }

  onAnular() {
    if (!this.razon.trim()) {
      this.uiService.showToast('Debe ingresar un motivo de anulación', 'warning');
      return;
    }

    this.loading = true;
    this.ncService.anularFacturaConNC(this.factura.id, this.razon).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.resultadoSri = res;
        
        const estado = this.estadoSri;
        if (estado.includes('AUTORIZA')) {
          this.uiService.showToast('Factura anulada exitosamente', 'success');
        } else {
          this.uiService.showToast('El SRI devolvió observaciones: ' + estado, 'warning');
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.mensaje || err.error?.detail || 'Error al intentar anular la factura';
        this.uiService.showError(msg);
      }
    });
  }
}



