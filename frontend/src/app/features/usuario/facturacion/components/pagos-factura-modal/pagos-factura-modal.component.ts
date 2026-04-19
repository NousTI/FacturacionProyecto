import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Factura } from '../../../../../domain/models/factura.model';
import { FacturasService } from '../../services/facturas.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { PermissionsService } from '../../../../../core/auth/permissions.service';
import { FACTURAS_PERMISSIONS } from '../../../../../constants/permission-codes';
import { finalize } from 'rxjs';
import { SRI_FORMAS_PAGO } from '../../../../../core/constants/sri-iva.constants';
@Component({
  selector: 'app-pagos-factura-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal fade show d-block" tabindex="-1" style="background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          
          <div class="modal-header border-bottom border-light p-4">
            <div class="d-flex align-items-center gap-3">
              <div class="header-icon-branded">
                <i class="bi bi-cash-stack"></i>
              </div>
              <div>
                <h5 class="modal-title fw-bold text-dark mb-0">
                  Pagos y Abonos
                </h5>
                <p class="text-muted small mb-0">{{ factura.numero_factura || 'Borrador' }}</p>
              </div>
            </div>
            <button type="button" class="btn-close-branded" (click)="close.emit(hasModifications)">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body p-4 bg-light scroll-custom" style="max-height: 75vh; overflow-y: auto;">
            
            <!-- Resumen Saldo -->
            <div class="row g-3 mb-4" *ngIf="resumen">
              <div class="col-md-4">
                <div class="card border-0 shadow-sm rounded-4 h-100">
                  <div class="card-body text-center p-3">
                    <p class="text-muted-xs mb-1 uppercase-label">Total Factura</p>
                    <h5 class="fw-bold text-dark mb-0 font-premium">{{ resumen.total_factura | currency:'USD' }}</h5>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border-0 shadow-sm rounded-4 h-100">
                  <div class="card-body text-center p-3">
                    <p class="text-muted-xs mb-1 uppercase-label">Monto Pagado</p>
                    <h5 class="fw-bold text-success mb-0 font-premium">{{ resumen.monto_pagado | currency:'USD' }}</h5>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border-0 shadow-sm rounded-4 h-100 bg-white border-2 border-danger-subtle">
                  <div class="card-body text-center p-3">
                    <p class="text-muted-xs mb-1 uppercase-label">Saldo Pendiente</p>
                    <h5 class="fw-bold text-danger mb-0 font-premium">{{ resumen.saldo_pendiente | currency:'USD' }}</h5>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nuevo Abono Form -->
            <div class="card border-0 shadow-sm rounded-4 mb-4 branded-form-card" *ngIf="resumen && resumen.saldo_pendiente > 0 && canCreatePago">
              <div class="card-body p-4">
                <h6 class="fw-800 mb-4 text-dark d-flex align-items-center gap-2">
                  <i class="bi bi-plus-circle-fill text-primary-brand"></i>
                  Registrar Nuevo Abono
                </h6>
                <form (ngSubmit)="registrarAbono()" #form="ngForm">
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="editorial-label">Monto a Pagar ($)</label>
                      <div class="branded-input-group">
                        <span class="input-icon"><i class="bi bi-currency-dollar"></i></span>
                        <input type="number" class="branded-input" name="monto" [(ngModel)]="nuevoPago.monto" required min="0.01" [max]="resumen.saldo_pendiente" step="0.01">
                      </div>
                    </div>
                    <div class="col-md-4">
                      <label class="editorial-label">Método SRI</label>
                      <select class="branded-input" name="metodo" [(ngModel)]="nuevoPago.metodo_pago_sri" required>
                        <option *ngFor="let fp of formasPago" [value]="fp.codigo">{{ fp.label | uppercase }}</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="editorial-label">Nº Recibo / Ref</label>
                      <input type="text" class="branded-input" name="referencia" [(ngModel)]="nuevoPago.numero_recibo" placeholder="Opcional">
                    </div>
                    <div class="col-12">
                       <label class="editorial-label">Observaciones Internas</label>
                       <textarea class="branded-input" name="obs" [(ngModel)]="nuevoPago.observaciones" rows="1" placeholder="Ej. Depósito banco Pichincha..."></textarea>
                    </div>
                    <div class="col-12 text-end mt-4">
                      <button type="submit" class="btn-brand-primary" [disabled]="form.invalid || isProcessing">
                        <i class="bi bi-check2-circle me-2"></i> {{ isProcessing ? 'Procesando...' : 'Confirmar Abono' }}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <!-- Historial de Pagos -->
            <h6 class="fw-800 mb-3 text-dark d-flex align-items-center gap-2">
              <i class="bi bi-clock-history text-muted"></i>
              Historial de Recibos
              <span class="badge rounded-pill bg-dark ms-1" style="font-size: 0.65rem;">{{ pagos.length || 0 }}</span>
            </h6>

            <div class="row g-3">
              <div *ngIf="!pagos || pagos.length === 0" class="col-12">
                <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                  <div class="mb-3 opacity-25">
                    <i class="bi bi-inbox fs-1"></i>
                  </div>
                  <p class="text-muted fw-600 mb-0">No se han registrado abonos todavía.</p>
                </div>
              </div>

              <div class="col-md-6" *ngFor="let pago of pagos">
                <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden receipt-card">
                  <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                      <div class="receipt-date">
                        <i class="bi bi-calendar3 me-2"></i>
                        {{ (pago.fecha_pago || pago.created_at) | date:'dd MMM, yyyy' }}
                      </div>
                      <div class="receipt-amount">{{ pago.monto | currency:'USD' }}</div>
                    </div>
                    
                    <div class="receipt-meta row g-2">
                      <div class="col-6">
                        <label class="text-muted-xs uppercase-label">Recibo</label>
                        <div class="fw-800 text-dark small">{{ pago.numero_recibo || 'S/N' }}</div>
                      </div>
                      <div class="col-6 text-end">
                        <label class="text-muted-xs uppercase-label">Método</label>
                        <div class="fw-700 text-dark small" style="font-size: 0.75rem;">{{ getMetodoPagoLabel(pago.metodo_pago_sri || pago.metodo_pago) }}</div>
                      </div>
                    </div>

                    <div *ngIf="pago.observaciones" class="mt-3 pt-3 border-top border-light">
                      <p class="small text-muted mb-0 font-italic">
                        "{{ pago.observaciones }}"
                      </p>
                    </div>

                    <div *ngIf="pago.comprobante_url" class="mt-3">
                      <a [href]="pago.comprobante_url" target="_blank" class="btn-brand-outline w-100">
                        <i class="bi bi-file-earmark-pdf me-2"></i> Ver Comprobante
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  `
  ,
  styles: [`
    .fw-800 { font-weight: 800; }
    .fw-700 { font-weight: 700; }
    .fw-600 { font-weight: 600; }
    .font-premium { letter-spacing: -0.02em; }
    .uppercase-label { text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; font-size: 0.65rem; }
    .text-muted-xs { color: #94a3b8; }
    .text-primary-brand { color: var(--primary-color); }

    .header-icon-branded {
      width: 48px; height: 48px; border-radius: 14px;
      background: #f1f5f9; color: black;
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
    }

    .btn-close-branded {
      width: 32px; height: 32px; border-radius: 10px; border: none;
      background: #f1f5f9; color: #64748b;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-close-branded:hover { background: #fee2e2; color: #ef4444; }

    .editorial-label { display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 0.5rem; }
    
    .branded-input-group { position: relative; }
    .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-weight: 700; }
    .branded-input { 
      width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; 
      background: white; font-size: 0.95rem; font-weight: 600; transition: all 0.2s; outline: none;
    }
    .branded-input-group .branded-input { padding-left: 2.2rem; }
    .branded-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 4px rgba(67, 82, 243, 0.1); }

    .btn-brand-primary {
      padding: 0.75rem 2rem; border-radius: 12px; border: none;
      background: var(--primary-color); color: white; font-weight: 700; transition: all 0.2s;
    }
    .btn-brand-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(67, 82, 243, 0.25); }
    .btn-brand-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-brand-outline {
      padding: 0.6rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0;
      background: white; color: #475569; font-weight: 700; font-size: 0.85rem;
      transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;
    }
    .btn-brand-outline:hover { background: #f8fafc; border-color: var(--primary-color); color: var(--primary-color); }

    .receipt-card { transition: all 0.2s; border: 1px solid transparent; }
    .receipt-card:hover { transform: translateY(-3px); border-color: #f1f5f9; }
    .receipt-date { font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
    .receipt-amount { font-size: 1.15rem; font-weight: 850; color: black; }

    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class PagosFacturaModalComponent implements OnInit {
  @Input() factura!: Factura;
  @Output() close = new EventEmitter<boolean>();

  readonly formasPago = SRI_FORMAS_PAGO;
  resumen: any = null;
  pagos: any[] = [];
  isProcessing: boolean = false;
  hasModifications: boolean = false;

  nuevoPago = {
    monto: 0,
    metodo_pago_sri: '01',
    numero_recibo: '',
    observaciones: ''
  };

  constructor(
    private facturasService: FacturasService,
    private uiService: UiService,
    private permissionsService: PermissionsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // VALIDACIÓN 1: Guardia - Verificar permisos de creación (y por ende lectura implícita) de pagos
    const canViewPayments = this.permissionsService.isAdminEmpresa || 
                            this.permissionsService.hasPermission('PAGO_FACTURA_CREAR');
                            
    if (!canViewPayments) {
      this.uiService.showToast('No tienes permisos para visualizar o gestionar pagos', 'warning');
      this.close.emit(false);
      return;
    }

    this.cargarDatos();
  }

  // VALIDACIÓN 3: UX - Getter para habilitar creación de nuevos pagos
  get canCreatePago(): boolean {
    return this.permissionsService.isAdminEmpresa || this.permissionsService.hasPermission('PAGO_FACTURA_CREAR');
  }

  getMetodoPagoLabel(code: string): string {
    return SRI_FORMAS_PAGO.find(fp => fp.codigo === code)?.label ?? `Otros (${code})`;
  }

  cargarDatos() {
    this.facturasService.obtenerResumenPagos(this.factura.id).subscribe({
      next: (res) => {
        this.resumen = res;
        this.nuevoPago.monto = res.saldo_pendiente > 0 ? res.saldo_pendiente : 0;
        this.cd.detectChanges();
      },
      error: () => this.uiService.showToast('No se pudo cargar el resumen de pagos', 'warning')
    });

    this.facturasService.listarPagos(this.factura.id).subscribe({
      next: (data) => {
        console.log('Historial de Pagos Recibido del Backend:', data);
        this.pagos = data;
        this.cd.detectChanges();
      },
      error: () => this.uiService.showToast('No se pudo cargar el historial', 'warning')
    });
  }

  registrarAbono() {
    if (!this.resumen || this.nuevoPago.monto <= 0 || this.nuevoPago.monto > this.resumen.saldo_pendiente) {
      this.uiService.showToast('El monto es inválido', 'warning');
      return;
    }

    // VALIDACIÓN 2: Doble verificación de permisos antes de crear pago
    if (!this.canCreatePago) {
      this.uiService.showError('Permiso denegado: No tienes autorización para registrar pagos', 'error');
      return;
    }

    this.isProcessing = true;
    const payload = { 
      ...this.nuevoPago, 
      factura_id: this.factura.id 
    };

    console.log('Payload de Abono enviado:', payload);

    this.facturasService.registrarPago(this.factura.id, payload)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: () => {
          this.uiService.showToast('Abono registrado exitosamente', 'success');
          this.hasModifications = true;
          this.nuevoPago.numero_recibo = '';
          this.nuevoPago.observaciones = '';
          this.cargarDatos();
        },
        error: (err) => this.uiService.showError(err, 'Error al registrar abono')
      });
  }
}

