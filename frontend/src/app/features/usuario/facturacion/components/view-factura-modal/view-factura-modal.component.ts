import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturasService } from '../../services/facturas.service';
import { Factura, FacturaDetalle } from '../../../../../domain/models/factura.model';

@Component({
  selector: 'app-view-factura-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop fade show" style="display: block; background-color: rgba(0,0,0,0.3);"></div>
    <div class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 rounded-3 shadow">
          
          <!-- HEADER MINIMALISTA -->
          <div class="modal-header border-bottom px-4 pt-4 pb-3 bg-white">
            <div class="d-flex flex-column w-100">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div class="text-muted small text-uppercase fw-semibold mb-1" style="letter-spacing: 1px;">Factura Electrónica</div>
                  <h4 class="fw-bold mb-0 text-dark">{{ factura?.numero_factura || 'BORRADOR' }}</h4>
                </div>
                <button type="button" class="btn-close" (click)="close()"></button>
              </div>
              
              <div class="d-flex flex-wrap gap-2 text-muted" style="font-size: 0.85rem;">
                <span class="d-inline-flex align-items-center"><i class="bi bi-circle-fill me-1" [ngClass]="{'text-success': factura?.estado==='AUTORIZADA', 'text-warning': factura?.estado==='EN_PROCESO', 'text-danger': factura?.estado==='ANULADA'}" style="font-size: 0.4rem;"></i> {{ factura?.estado }}</span>
                <span class="border-start border-secondary opacity-25 mx-1"></span>
                <span>{{ factura?.estado_pago }}</span>
                <span class="border-start border-secondary opacity-25 mx-1"></span>
                <span>{{ factura?.fecha_emision | date:'dd MMM, yyyy' }}</span>
                <span *ngIf="factura?.ambiente === 1" class="border-start border-secondary opacity-25 mx-1"></span>
                <span *ngIf="factura?.ambiente === 1" class="text-warning fw-semibold">PRUEBAS</span>
              </div>
            </div>
          </div>

          <!-- BODY MINIMALISTA -->
          <div class="modal-body p-4 p-md-5 bg-white">
            <div *ngIf="isLoading" class="text-center py-5">
              <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
            </div>

            <div *ngIf="errorMessage" class="text-danger py-3 text-center">
              {{ errorMessage }}
            </div>

            <div *ngIf="!isLoading && factura">
              
              <!-- DATOS SRI SIMPLES -->
              <div class="row mb-5 pb-4 border-bottom" *ngIf="factura.clave_acceso || factura.numero_autorizacion">
                <div class="col-md-12 mb-2">
                  <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.75rem; letter-spacing: 1px;">Documento SRI</h6>
                </div>
                <div class="col-md-6 mb-3 mb-md-0" *ngIf="factura.clave_acceso">
                  <div class="text-muted mb-1" style="font-size: 0.8rem;">Clave de Acceso</div>
                  <div class="text-dark font-monospace" style="font-size: 0.9rem;">{{ factura.clave_acceso }}</div>
                </div>
                <div class="col-md-6" *ngIf="factura.numero_autorizacion">
                   <div class="text-muted mb-1" style="font-size: 0.8rem;">Autorización SRI</div>
                   <div class="text-dark font-monospace" style="font-size: 0.9rem;">{{ factura.numero_autorizacion }}</div>
                </div>
              </div>

              <!-- EMISOR Y CLIENTE -->
              <div class="row mb-5 pb-4 border-bottom">
                
                <!-- Emisor -->
                <div class="col-md-5 mb-4 mb-md-0">
                  <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.75rem; letter-spacing: 1px;">Datos del Emisor</h6>
                  <p class="mb-1 text-dark fw-bold">{{ factura.snapshot_empresa?.razon_social }}</p>
                  <p class="mb-1 text-secondary" style="font-size: 0.9rem;">RUC: {{ factura.snapshot_empresa?.ruc }}</p>
                  <p class="mb-1 text-secondary" style="font-size: 0.9rem;">{{ factura.snapshot_empresa?.direccion }}</p>
                  <p class="mb-0 text-secondary" style="font-size: 0.9rem;">{{ factura.snapshot_empresa?.email }}</p>
                </div>

                <!-- Cliente -->
                <div class="col-md-5 offset-md-1">
                  <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.75rem; letter-spacing: 1px;">Cobrar a</h6>
                  <p class="mb-1 text-dark fw-bold">{{ factura.snapshot_cliente?.razon_social || (factura.snapshot_cliente?.nombres + ' ' + factura.snapshot_cliente?.apellidos) }}</p>
                  <p class="mb-1 text-secondary" style="font-size: 0.9rem;">{{ factura.snapshot_cliente?.tipo_identificacion }}: {{ factura.snapshot_cliente?.numero_identificacion }}</p>
                  <p class="mb-1 text-secondary" style="font-size: 0.9rem;">{{ factura.snapshot_cliente?.direccion || 'Sin dirección' }}</p>
                  <p class="mb-0 text-secondary" style="font-size: 0.9rem;">{{ factura.snapshot_cliente?.email }}</p>
                </div>

              </div>

              <div class="row mb-5 pb-4 border-bottom">
                 <div class="col-md-4" *ngIf="factura.fecha_vencimiento">
                  <h6 class="text-uppercase text-muted fw-bold mb-2" style="font-size: 0.75rem; letter-spacing: 1px;">Vencimiento</h6>
                  <div class="text-dark" style="font-size: 0.9rem;">{{ factura.fecha_vencimiento | date:'dd/MM/yyyy' }}</div>
                 </div>
                 <div class="col-md-4">
                  <h6 class="text-uppercase text-muted fw-bold mb-2" style="font-size: 0.75rem; letter-spacing: 1px;">Forma de Pago SRI</h6>
                  <div class="text-dark" style="font-size: 0.9rem;">{{ getFormaPagoLabel(factura.forma_pago_sri) }}</div>
                 </div>
                 <div class="col-md-4" *ngIf="factura.plazo">
                  <h6 class="text-uppercase text-muted fw-bold mb-2" style="font-size: 0.75rem; letter-spacing: 1px;">Plazo</h6>
                  <div class="text-dark" style="font-size: 0.9rem;">{{ factura.plazo }} {{ factura.unidad_tiempo }}</div>
                 </div>
              </div>

              <!-- DETALLES: TABLA MINIMALISTA -->
              <div class="mb-5">
                <h6 class="text-uppercase text-muted fw-bold mb-4" style="font-size: 0.75rem; letter-spacing: 1px;">Detalle de Productos</h6>
                
                <div *ngIf="loadingDetalles" class="text-center py-4">
                  <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
                </div>

                <div *ngIf="!loadingDetalles" class="row g-3">
                  <div class="col-12 col-md-6 col-lg-4" *ngFor="let d of detalles">
                    <div class="card border border-light-subtle rounded-3 h-100 shadow-sm transition-hover">
                      <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <h6 class="fw-bold text-dark mb-0 line-clamp-1" title="{{ d.nombre }}">{{ d.nombre }}</h6>
                          <span class="badge bg-light text-muted border py-1 px-2" style="font-size: 0.7rem;">{{ d.codigo_producto }}</span>
                        </div>
                        
                        <div class="row g-2 mt-2">
                          <div class="col-6">
                            <label class="text-muted d-block small" style="font-size: 0.7rem;">Cantidad</label>
                            <span class="fw-semibold">{{ d.cantidad }}</span>
                          </div>
                          <div class="col-6 text-end">
                            <label class="text-muted d-block small" style="font-size: 0.7rem;">Precio Unit.</label>
                            <span>{{ d.precio_unitario | currency:'USD' }}</span>
                          </div>
                          <div class="col-6" *ngIf="d.descuento > 0">
                            <label class="text-muted d-block small" style="font-size: 0.7rem;">Descuento</label>
                            <span class="text-muted small">-{{ d.descuento | currency:'USD' }}</span>
                          </div>
                          <div class="col-6 ms-auto text-end">
                            <label class="text-muted d-block small" style="font-size: 0.7rem;">Subtotal</label>
                            <span class="fw-bold text-primary">{{ d.subtotal | currency:'USD' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div *ngIf="!loadingDetalles && detalles.length === 0" class="text-center py-5 text-muted bg-light rounded-3">
                    <i class="bi bi-cart-x fs-2 mb-2 d-block"></i>
                    <p class="mb-0">No hay detalles registrados en esta factura.</p>
                </div>
              </div>

              <!-- TOTALES Y OBS -->
              <div class="row">
                <div class="col-lg-6 mb-4 mb-lg-0">
                  <div *ngIf="factura.observaciones">
                    <h6 class="text-uppercase text-muted fw-bold mb-2" style="font-size: 0.75rem; letter-spacing: 1px;">Observaciones</h6>
                    <p class="text-secondary" style="font-size: 0.9rem;">{{ factura.observaciones }}</p>
                  </div>
                </div>
                
                <div class="col-lg-4 offset-lg-2">
                  <div class="d-flex justify-content-between mb-2" style="font-size: 0.95rem;">
                    <span class="text-muted">Subtotal 0%</span>
                    <span class="text-dark">{{ factura.subtotal_sin_iva | currency:'USD' }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2" style="font-size: 0.95rem;">
                    <span class="text-muted">Subtotal IVA</span>
                    <span class="text-dark">{{ factura.subtotal_con_iva | currency:'USD' }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2" style="font-size: 0.95rem;">
                    <span class="text-muted">Valor IVA</span>
                    <span class="text-dark">{{ factura.iva | currency:'USD' }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2" style="font-size: 0.95rem;" *ngIf="factura.descuento > 0">
                    <span class="text-muted">Descuento</span>
                    <span class="text-dark">-{{ factura.descuento | currency:'USD' }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-3" style="font-size: 0.95rem;" *ngIf="factura.propina > 0">
                    <span class="text-muted">Propina</span>
                    <span class="text-dark">{{ factura.propina | currency:'USD' }}</span>
                  </div>
                  
                  <div class="border-top border-dark border-1 mb-2"></div>
                  
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-dark fs-5">TOTAL</span>
                    <span class="fw-bold text-dark fs-4">{{ factura.total | currency:'USD' }}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- FOOTER -->
          <div class="modal-footer border-top px-4 py-3 bg-white">
            <button type="button" class="btn btn-dark px-4" (click)="close()">Cerrar</button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .font-monospace { font-family: 'Courier New', Courier, monospace; }
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .transition-hover {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .transition-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
    }
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

  constructor(
    private facturasService: FacturasService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadFactura();
  }

  loadFactura() {
    this.isLoading = true;
    console.log('Cargando factura ID:', this.facturaId);
    this.facturasService.obtenerFactura(this.facturaId).subscribe({
      next: (factura) => {
        console.log('Factura cargada:', factura);
        this.factura = factura;
        this.isLoading = false;
        this.cd.detectChanges(); // Force update
        this.loadDetalles();
      },
      error: (err) => {
        console.error('Error cargando factura:', err);
        this.errorMessage = 'No se pudo cargar la información de la factura.';
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  loadDetalles() {
    this.loadingDetalles = true;
    console.log('Cargando detalles de factura ID:', this.facturaId);
    this.facturasService.obtenerDetalles(this.facturaId).subscribe({
      next: (detalles) => {
        console.log('Detalles cargados:', detalles);
        this.detalles = detalles;
        this.loadingDetalles = false;
        this.cd.detectChanges(); // Force update
      },
      error: (err) => {
        console.error('Error cargando detalles:', err);
        this.loadingDetalles = false;
        this.cd.detectChanges();
      }
    });
  }

  getFormaPagoLabel(code: string): string {
    const map: Record<string, string> = {
      '01': 'Sin utilización del sistema financiero (Efectivo)',
      '15': 'Compensación de deudas',
      '16': 'Tarjeta de Débito',
      '17': 'Dinero Electrónico',
      '18': 'Tarjeta Prepago',
      '19': 'Tarjeta de Crédito',
      '20': 'Otros con utilización del sistema financiero',
      '21': 'Endoso de Títulos'
    };
    return map[code] || 'Otros (' + code + ')';
  }

  close() {
    this.onClose.emit();
  }
}
