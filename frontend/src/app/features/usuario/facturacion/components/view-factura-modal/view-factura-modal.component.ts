import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturasService } from '../../services/facturas.service';
import { Factura, FacturaDetalle } from '../../../../../domain/models/factura.model';

@Component({
  selector: 'app-view-factura-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop fade show" style="display: block;"></div>
    <div class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg rounded-4">
          
          <!-- HEADER -->
          <div class="modal-header border-bottom-0 pb-0">
            <div class="w-100">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h5 class="modal-title fw-bold text-dark mb-1">Factura {{ factura?.numero_factura }}</h5>
                  <div class="d-flex gap-2 align-items-center">
                    <span class="badge rounded-pill" 
                          [ngClass]="{
                            'text-bg-secondary': factura?.estado === 'BORRADOR',
                            'text-bg-success': factura?.estado === 'EMITIDA',
                            'text-bg-danger': factura?.estado === 'ANULADA'
                          }">
                      {{ factura?.estado }}
                    </span>
                    <span class="badge rounded-pill"
                          [ngClass]="{
                            'text-bg-warning': factura?.estado_pago === 'PENDIENTE',
                            'text-bg-success': factura?.estado_pago === 'PAGADO',
                            'text-bg-info': factura?.estado_pago === 'PARCIAL',
                            'text-bg-danger': factura?.estado_pago === 'VENCIDO'
                          }">
                      {{ factura?.estado_pago }}
                    </span>
                    <span *ngIf="factura?.snapshot_empresa" class="badge rounded-pill" 
                          [ngClass]="factura?.ambiente === 2 ? 'text-bg-success' : 'text-bg-warning'">
                      {{ factura?.ambiente === 2 ? 'PRODUCCIÓN' : 'PRUEBAS' }}
                    </span>
                  </div>
                </div>
                <button type="button" class="btn-close" (click)="close()"></button>
              </div>
            </div>
          </div>

          <!-- BODY -->
          <div class="modal-body p-4">
            <div *ngIf="isLoading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>

            <div *ngIf="errorMessage" class="alert alert-danger" role="alert">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ errorMessage }}
            </div>

            <div *ngIf="!isLoading && factura">
              <!-- INFORMACIÓN GENERAL -->
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <div class="card border-0 bg-light rounded-4 h-100">
                    <div class="card-body">
                      <h6 class="fw-bold text-dark mb-3"><i class="bi bi-building me-2"></i>Empresa Emisora</h6>
                      <p class="mb-1"><strong>{{ factura.snapshot_empresa?.razon_social }}</strong></p>
                      <p class="mb-1 text-muted small">RUC: {{ factura.snapshot_empresa?.ruc }}</p>
                      <p class="mb-1 text-muted small">{{ factura.snapshot_empresa?.direccion }}</p>
                      <p class="mb-0 text-muted small">{{ factura.snapshot_empresa?.email }}</p>
                    </div>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="card border-0 bg-light rounded-4 h-100">
                    <div class="card-body">
                      <h6 class="fw-bold text-dark mb-3"><i class="bi bi-person me-2"></i>Cliente</h6>
                      <p class="mb-1"><strong>{{ factura.snapshot_cliente?.razon_social || (factura.snapshot_cliente?.nombres + ' ' + factura.snapshot_cliente?.apellidos) }}</strong></p>
                      <p class="mb-1 text-muted small">{{ factura.snapshot_cliente?.tipo_identificacion }}: {{ factura.snapshot_cliente?.numero_identificacion }}</p>
                      <p class="mb-1 text-muted small">{{ factura.snapshot_cliente?.direccion }}</p>
                      <p class="mb-0 text-muted small">{{ factura.snapshot_cliente?.email }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- FECHAS Y DATOS SRI -->
              <div class="row g-3 mb-4">
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted small">Fecha Emisión</label>
                  <p class="mb-0">{{ factura.fecha_emision | date:'dd/MM/yyyy' }}</p>
                </div>
                <div class="col-md-3" *ngIf="factura.fecha_vencimiento">
                  <label class="form-label fw-semibold text-muted small">Fecha Vencimiento</label>
                  <p class="mb-0">{{ factura.fecha_vencimiento | date:'dd/MM/yyyy' }}</p>
                </div>
                <div class="col-md-3" *ngIf="factura.clave_acceso">
                  <label class="form-label fw-semibold text-muted small">Clave de Acceso</label>
                  <p class="mb-0 small font-monospace">{{ factura.clave_acceso }}</p>
                </div>
                <div class="col-md-3" *ngIf="factura.numero_autorizacion">
                  <label class="form-label fw-semibold text-muted small">Autorización SRI</label>
                  <p class="mb-0 small font-monospace">{{ factura.numero_autorizacion }}</p>
                </div>
              </div>

              <!-- DETALLES DE PRODUCTOS -->
              <div class="card border-0 bg-light rounded-4 mb-4">
                <div class="card-body p-3">
                  <h6 class="fw-bold text-dark mb-3">Detalle de Productos</h6>
                  
                  <div *ngIf="loadingDetalles" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                  </div>

                  <div *ngIf="!loadingDetalles" class="table-responsive">
                    <table class="table table-borderless align-middle mb-0">
                      <thead class="text-muted small text-uppercase">
                        <tr>
                          <th>Código</th>
                          <th>Descripción</th>
                          <th class="text-end">Cant.</th>
                          <th class="text-end">P. Unit.</th>
                          <th class="text-end">Desc.</th>
                          <th class="text-end">IVA</th>
                          <th class="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let detalle of detalles" class="border-bottom border-light">
                          <td class="small">{{ detalle.codigo_producto }}</td>
                          <td>{{ detalle.nombre }}</td>
                          <td class="text-end">{{ detalle.cantidad }}</td>
                          <td class="text-end">{{ detalle.precio_unitario | currency:'USD' }}</td>
                          <td class="text-end">{{ detalle.descuento | currency:'USD' }}</td>
                          <td class="text-end">{{ detalle.valor_iva | currency:'USD' }}</td>
                          <td class="text-end fw-semibold">{{ detalle.subtotal | currency:'USD' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div *ngIf="!loadingDetalles && detalles.length === 0" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay detalles en esta factura
                  </div>
                </div>
              </div>

              <!-- TOTALES -->
              <div class="row">
                <div class="col-lg-6">
                  <div *ngIf="factura.observaciones" class="mb-3">
                    <label class="form-label fw-semibold text-muted small">Observaciones</label>
                    <p class="mb-0">{{ factura.observaciones }}</p>
                  </div>
                </div>
                <div class="col-lg-4 offset-lg-2">
                  <div class="bg-white p-3 rounded-4 border border-light">
                    <div class="d-flex justify-content-between mb-2 text-muted">
                      <span>Subtotal Sin IVA</span>
                      <span>{{ factura.subtotal_sin_iva | currency:'USD' }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2 text-muted">
                      <span>Subtotal Con IVA</span>
                      <span>{{ factura.subtotal_con_iva | currency:'USD' }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2 text-muted">
                      <span>IVA</span>
                      <span>{{ factura.iva | currency:'USD' }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2 text-muted" *ngIf="factura.descuento > 0">
                      <span>Descuento</span>
                      <span class="text-danger">- {{ factura.descuento | currency:'USD' }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2 text-muted" *ngIf="factura.propina > 0">
                      <span>Propina</span>
                      <span>{{ factura.propina | currency:'USD' }}</span>
                    </div>
                    <div class="border-top my-2"></div>
                    <div class="d-flex justify-content-between fw-bold fs-5 text-dark">
                      <span>TOTAL</span>
                      <span>{{ factura.total | currency:'USD' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer border-top-0 pt-0 pb-4 pe-4">
            <button type="button" class="btn btn-light rounded-pill px-4" (click)="close()">Cerrar</button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { opacity: 0.5; }
    .font-monospace { font-family: 'Courier New', monospace; }
  `]
})
export class ViewFacturaModalComponent implements OnInit {
  @Input() facturaId!: string;
  @Output() onClose = new EventEmitter<void>();

  factura: Factura | null = null;
  detalles: FacturaDetalle[] = [];
  isLoading = true;
  loadingDetalles = true;
  errorMessage: string = '';

  constructor(private facturasService: FacturasService) { }

  ngOnInit() {
    this.loadFactura();
  }

  loadFactura() {
    this.isLoading = true;
    this.facturasService.obtenerFactura(this.facturaId).subscribe({
      next: (factura) => {
        this.factura = factura;
        this.isLoading = false;
        this.loadDetalles();
      },
      error: (err) => {
        console.error('Error cargando factura:', err);
        this.isLoading = false;
      }
    });
  }

  loadDetalles() {
    this.loadingDetalles = true;
    this.facturasService.obtenerDetalles(this.facturaId).subscribe({
      next: (detalles) => {
        this.detalles = detalles;
        this.loadingDetalles = false;
      },
      error: (err) => {
        console.error('Error cargando detalles:', err);
        this.loadingDetalles = false;
      }
    });
  }

  close() {
    this.onClose.emit();
  }
}
