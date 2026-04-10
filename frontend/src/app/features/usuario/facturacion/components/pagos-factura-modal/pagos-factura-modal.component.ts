import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Factura } from '../../../../../domain/models/factura.model';
import { FacturasService } from '../../services/facturas.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { PermissionsService } from '../../../../../core/auth/permissions.service';
import { FACTURAS_PERMISSIONS } from '../../../../../constants/permission-codes';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-pagos-factura-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content shadow-lg border-0 rounded-4">
          
          <div class="modal-header border-bottom border-light p-4">
            <div>
              <h5 class="modal-title fw-bold text-dark mb-1">
                Pagos y Abonos - {{ factura.numero_factura || 'Borrador' }}
              </h5>
              <p class="text-muted small mb-0">Gestiona los recibos de cobro de esta factura</p>
            </div>
            <button type="button" class="btn-close" (click)="close.emit(hasModifications)"></button>
          </div>

          <div class="modal-body p-4 bg-light">
            
            <!-- Resumen Saldo -->
            <div class="row g-3 mb-4" *ngIf="resumen">
              <div class="col-md-4">
                <div class="card border-0 shadow-sm rounded-4 h-100">
                  <div class="card-body text-center p-3">
                    <p class="text-muted small mb-1">Total Factura</p>
                    <h5 class="fw-bold mb-0">{{ resumen.total_factura | currency:'USD' }}</h5>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border-0 shadow-sm rounded-4 h-100">
                  <div class="card-body text-center p-3">
                    <p class="text-muted small mb-1">Monto Pagado</p>
                    <h5 class="fw-bold text-success mb-0">{{ resumen.monto_pagado | currency:'USD' }}</h5>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card border-0 shadow-sm rounded-4 h-100">
                  <div class="card-body text-center p-3">
                    <p class="text-muted small mb-1">Saldo Pendiente</p>
                    <h5 class="fw-bold text-danger mb-0">{{ resumen.saldo_pendiente | currency:'USD' }}</h5>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nuevo Abono Form -->
            <div class="card border-0 shadow-sm rounded-4 mb-4" *ngIf="resumen && resumen.saldo_pendiente > 0">
              <div class="card-body p-4">
                <h6 class="fw-bold mb-3"><i class="bi bi-plus-circle me-2 text-primary"></i>Registrar Nuevo Abono</h6>
                <form (ngSubmit)="registrarAbono()" #form="ngForm">
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label small text-muted fw-bold">Monto a Pagar ($)</label>
                      <input type="number" class="form-control form-control-sm" name="monto" [(ngModel)]="nuevoPago.monto" required min="0.01" [max]="resumen.saldo_pendiente" step="0.01">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label small text-muted fw-bold">Método SRI</label>
                      <select class="form-select form-select-sm" name="metodo" [(ngModel)]="nuevoPago.metodo_pago_sri" required>
                        <option value="01">Efectivo (01)</option>
                        <option value="15">Compensación (15)</option>
                        <option value="16">Tarjeta Débito (16)</option>
                        <option value="17">Dinero Electrónico (17)</option>
                        <option value="19">Tarjeta Crédito (19)</option>
                        <option value="20">Transferencia / Otros (20)</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label small text-muted fw-bold">Ref/Recibo (Opcional)</label>
                      <input type="text" class="form-control form-control-sm" name="referencia" [(ngModel)]="nuevoPago.numero_recibo" placeholder="Nro de Recibo">
                    </div>
                    <div class="col-12">
                      <label class="form-label small text-muted fw-bold">Observaciones</label>
                      <input type="text" class="form-control form-control-sm" name="obs" [(ngModel)]="nuevoPago.observaciones" placeholder="Ej. Depósito banco Pichincha...">
                    </div>
                    <div class="col-12 text-end mt-3">
                      <button type="submit" class="btn btn-primary btn-sm px-4 rounded-3" [disabled]="form.invalid || isProcessing || !canCreatePago" [title]="!canCreatePago ? 'No tienes permisos para crear pagos' : ''">
                        <i class="bi bi-save me-2"></i> {{ isProcessing ? 'Guardando...' : 'Guardar Abono' }}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <!-- Historial de Pagos -->
            <h6 class="fw-bold mb-3 text-dark">
              <i class="bi bi-clock-history me-2 text-muted"></i>
              Historial de Recibos ({{ pagos.length || 0 }})
            </h6>

            <div class="row g-3">
              <div *ngIf="!pagos || pagos.length === 0" class="col-12">
                <div class="card border-0 shadow-sm rounded-4 p-4 text-center text-muted">
                  <i class="bi bi-info-circle fs-2 mb-2"></i>
                  <p class="mb-0">No se han registrado abonos todavía.</p>
                </div>
              </div>

              <div class="col-md-6 col-lg-4" *ngFor="let pago of pagos">
                <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                  <div class="card-header bg-white border-0 pt-3 pb-0 px-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="badge bg-light text-dark border p-2 rounded-3">
                        <i class="bi bi-calendar-event me-1"></i>
                        {{ (pago.fecha_pago || pago.created_at) | date:'dd/MM/yyyy' }}
                      </span>
                      <span class="fw-bold text-primary">{{ pago.monto | currency:'USD' }}</span>
                    </div>
                  </div>
                  <div class="card-body p-3">
                    <div class="mb-2">
                      <label class="small text-muted d-block mb-1">Recibo</label>
                      <span class="fw-bold">{{ pago.numero_recibo }}</span>
                    </div>
                    <div class="mb-2" *ngIf="pago.numero_referencia">
                      <label class="small text-muted d-block mb-1">Referencia</label>
                      <span class="small font-monospace text-muted">{{ pago.numero_referencia }}</span>
                    </div>
                    <div class="mb-2">
                      <label class="small text-muted d-block mb-1">Método de Pago</label>
                      <span class="small">{{ getMetodoPagoLabel(pago.metodo_pago_sri || pago.metodo_pago) }}</span>
                    </div>
                    <div *ngIf="pago.comprobante_url" class="mb-2 pt-1">
                      <a [href]="pago.comprobante_url" target="_blank" class="btn btn-outline-primary btn-sm w-100 rounded-3">
                        <i class="bi bi-file-earmark-check me-1"></i> Ver Comprobante
                      </a>
                    </div>
                    <div *ngIf="pago.observaciones" class="mt-2 pt-2 border-top border-light">
                      <label class="small text-muted d-block mb-1">Observaciones</label>
                      <p class="small text-secondary mb-0 line-clamp-2">
                        {{ pago.observaciones }}
                      </p>
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
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class PagosFacturaModalComponent implements OnInit {
  @Input() factura!: Factura;
  @Output() close = new EventEmitter<boolean>();

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
    // VALIDACIÓN 1: Guardia - Verificar permisos de lectura/creación de pagos
    const canViewPayments = this.permissionsService.hasPermission(['PAGO_FACTURA_VER', 'PAGO_FACTURA_CREAR']);
    if (!canViewPayments) {
      this.uiService.showToast('No tienes permisos para gestionar pagos', 'warning');
      this.close.emit(false);
      return;
    }

    this.cargarDatos();
  }

  // VALIDACIÓN 3: UX - Getter para habilitar creación de nuevos pagos
  get canCreatePago(): boolean {
    return this.permissionsService.hasPermission(['PAGO_FACTURA_CREAR', 'PAGO_FACTURA_EDITAR']);
  }

  getMetodoPagoLabel(code: string): string {
    const map: Record<string, string> = {
      '01': 'Efectivo',
      '15': 'Compensación de deudas',
      '16': 'Tarjeta de Débito',
      '17': 'Dinero Electrónico',
      '18': 'Tarjeta Prepago',
      '19': 'Tarjeta de Crédito',
      '20': 'Transferencia / Banco',
      '21': 'Endoso de Títulos'
    };
    return map[code] || 'Otros (' + code + ')';
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
    if (!this.permissionsService.hasPermission(['PAGO_FACTURA_CREAR', 'PAGO_FACTURA_EDITAR'])) {
      this.uiService.showError('Permiso denegado: No puedes crear pagos', 'error');
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
