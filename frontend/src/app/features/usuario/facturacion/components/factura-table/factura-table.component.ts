import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Factura } from '../../../../../domain/models/factura.model';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { FacturaPaginacionComponent, PaginationState } from '../factura-paginacion/factura-paginacion.component';

// - [x] Create `FacturaPaginacionComponent`
// - [x] Update `FacturaTableComponent` to include pagination
// - [x] Fix `FacturacionPage` layout and styles
// - [x] Adjust `FacturaTableComponent` fine-tuning (margins, etc.)
// - [ ] Verify implementation

@Component({
  selector: 'app-factura-table',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective, FacturaPaginacionComponent],
  template: `
    <div class="table-container-lux">
      <div class="table-responsive-lux">
        <table class="table mb-0 align-middle">
          <thead>
            <tr>
              <th class="ps-4">Comprobante / ID</th>
              <th>Cliente / Receptor</th>
              <th style="width: 130px">Emisión</th>
              <th style="width: 140px">Total (USD)</th>
              <th style="width: 160px">Método Pago</th>
              <th style="width: 140px">Estado</th>
              <th class="text-end pe-4" style="width: 80px">Gesti&oacute;n</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let factura of facturas" class="row-lux">
              <!-- Numero y Secuencial -->
              <td class="ps-4">
                <div class="d-flex align-items-center">
                  <div class="item-icon-wrapper me-3" style="background: #f1f5f9; color: var(--primary-color);">
                    <i class="bi bi-file-earmark-text-fill"></i>
                  </div>
                  <div>
                    <span class="fw-bold text-dark d-block mb-0">{{ factura.numero_factura || 'BORRADOR' }}</span>
                    <small *ngIf="factura.numero_autorizacion" class="text-muted text-uppercase fw-800" style="font-size: 0.65rem; letter-spacing: 0.5px;">
                      AUTH: {{ factura.numero_autorizacion | slice:0:8 }}...
                    </small>
                  </div>
                </div>
              </td>

              <!-- Cliente -->
              <td>
                <div class="d-flex align-items-center">
                  <div class="avatar-soft-lux me-3" [style.background]="getAvatarColor(factura.snapshot_cliente?.razon_social || 'C', 0.1)" [style.color]="getAvatarColor(factura.snapshot_cliente?.razon_social || 'C', 1)">
                    {{ getInitials(factura.snapshot_cliente?.razon_social || 'Cliente') }}
                  </div>
                  <div>
                    <span class="fw-bold text-dark d-block mb-0">{{ factura.snapshot_cliente?.razon_social || 'Consumidor Final' }}</span>
                    <small class="text-muted" style="font-size: 0.75rem;">{{ factura.snapshot_cliente?.identificacion || '9999999999999' }}</small>
                  </div>
                </div>
              </td>

              <!-- Fecha -->
              <td>
                <div class="date-lux">{{ factura.fecha_emision | date:'dd MMM, yyyy' }}</div>
              </td>

               <!-- Total -->
              <td>
                <span class="price-lux">{{ factura.total | currency:'USD' }}</span>
              </td>

              <!-- Método Pago -->
              <td>
                <div class="payment-method-lux">
                  <i class="bi bi-wallet2 me-1"></i>
                  {{ getFormaPagoString(factura.forma_pago_sri) }}
                </div>
              </td>

              <!-- Estado Emisión -->
              <td>
                <div class="badge-status-lux mb-1" [ngClass]="getStatusClass(factura.estado)">
                  <div class="dot" *ngIf="!processingStates.has(factura.id)"></div>
                  <div class="spinner-border spinner-border-sm me-2" role="status" *ngIf="processingStates.has(factura.id)" style="width: 10px; height: 10px; border-width: 2px;"></div>
                  {{ processingStates.has(factura.id) ? (processingStates.get(factura.id) === 'emitir' ? 'ENVIANDO...' : 'CONSULTANDO...') : factura.estado }}
                </div>
                <div *ngIf="factura.estado === 'AUTORIZADA' || factura.estado === 'ANULADA'" class="badge-status-lux w-100" [ngClass]="getPaymentStatusClass(factura.estado_pago)">
                  <i class="bi bi-cash-stack me-1" style="font-size: 0.8rem;"></i>
                  {{ factura.estado_pago }}
                </div>
              </td>

              <!-- Acciones -->
              <td class="text-end pe-4">
                <div class="dropdown">
                  <button 
                    class="btn-trigger-lux" 
                    type="button" 
                    [id]="'actions-f-' + factura.id" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-f-' + factura.id">
                    
                    <li> 
                      <a class="dropdown-item py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view', factura})">
                        <div class="icon-item bg-soft-info"><i class="bi bi-eye-fill"></i></div>
                        <span class="ms-2">Ver Detalles</span>
                      </a>
                    </li>

                    <ng-container *hasPermission="'FACTURAS_EDITAR'">
                      <li *ngIf="factura.estado === 'BORRADOR'">
                        <a class="dropdown-item py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'edit', factura})">
                          <div class="icon-item bg-soft-primary"><i class="bi bi-pencil-fill"></i></div>
                          <span class="ms-2">Editar</span>
                        </a>
                      </li>
                    </ng-container>

                    <ng-container *hasPermission="'FACTURAS_ENVIAR_SRI'">
                      <li *ngIf="['BORRADOR', 'DEVUELTA', 'ERROR_TECNICO'].includes(factura.estado)">
                        <a class="dropdown-item py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'sri', factura})">
                          <div class="icon-item bg-soft-success"><i class="bi bi-cloud-arrow-up-fill"></i></div>
                          <span class="ms-2 text-success">Enviar al SRI</span>
                        </a>
                      </li>

                      <li *ngIf="factura.estado === 'EN_PROCESO'">
                        <a class="dropdown-item py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'consultar', factura})">
                          <div class="icon-item bg-soft-info"><i class="bi bi-arrow-clockwise"></i></div>
                          <span class="ms-2 text-info">Consultar SRI</span>
                        </a>
                      </li>
                    </ng-container>

                    <ng-container *hasPermission="'FACTURAS_DESCARGAR_PDF'">
                      <li *ngIf="factura.estado === 'AUTORIZADA' || factura.estado === 'ANULADA'">
                        <a class="dropdown-item py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'pdf', factura})">
                          <div class="icon-item bg-soft-danger"><i class="bi bi-file-earmark-pdf-fill"></i></div>
                          <span class="ms-2">Descargar PDF</span>
                        </a>
                      </li>
                    </ng-container>

                    <ng-container *hasPermission="'FACTURAS_ENVIAR_EMAIL'">
                      <li *ngIf="factura.estado === 'AUTORIZADA' || factura.estado === 'ANULADA'">
                        <a class="dropdown-item py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'email', factura})">
                          <div class="icon-item bg-soft-secondary"><i class="bi bi-envelope-fill"></i></div>
                          <span class="ms-2">Enviar Email</span>
                        </a>
                      </li>
                    </ng-container>

                    <ng-container *hasPermission="'FACTURAS_ANULAR'">
                      <li *ngIf="factura.estado === 'AUTORIZADA'">
                        <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" (click)="onAction.emit({type: 'anular', factura})">
                          <div class="icon-item bg-soft-danger"><i class="bi bi-x-circle-fill"></i></div>
                          <span class="ms-2">Anular Factura</span>
                        </a>
                      </li>
                    </ng-container>

                    <ng-container *hasPermission="'PAGO_FACTURA_CREAR'">
                      <li *ngIf="factura.estado === 'AUTORIZADA'">
                        <a class="dropdown-item py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'abono', factura})">
                          <div class="icon-item bg-soft-primary">
                             <i class="bi bi-wallet2 text-primary"></i>
                          </div>
                          <span class="ms-2 fw-bold text-primary">Detalle de Pagos / Abonos</span>
                        </a>
                      </li>
                    </ng-container>

                    <ng-container *hasPermission="'FACTURAS_EDITAR'">
                      <li *ngIf="factura.estado === 'BORRADOR'">
                        <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" (click)="onAction.emit({type: 'delete', factura})">
                          <div class="icon-item bg-soft-danger"><i class="bi bi-trash3-fill"></i></div>
                          <span class="ms-2">Eliminar</span>
                        </a>
                      </li>
                    </ng-container>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="facturas.length === 0" class="empty-state py-5 text-center">
          <div class="empty-icon-bg mb-3 mx-auto">
            <i class="bi bi-receipt"></i>
          </div>
          <h5 class="fw-bold text-dark">No hay registros</h5>
          <p class="text-muted small">No se encontraron facturas con los filtros actuales.</p>
        </div>
      </div>

      <!-- Paginación integrada -->
      <app-factura-paginacion
        [pagination]="pagination"
        (pageChange)="pageChange.emit($event)"
        (pageSizeChange)="pageSizeChange.emit($event)"
      ></app-factura-paginacion>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
    }

    .table-container-lux {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      margin-top: 0;
      margin-bottom: 0;
    }

    .table-responsive-lux {
      flex: 1;
      overflow-y: auto;
      overflow-x: auto;
      position: relative;
    }

    .table thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #fcfdfe;
      padding: 1.25rem 1rem;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 800;
      border-bottom: 1px solid #f1f5f9;
    }

    .row-lux {
      transition: background-color 0.2s;
    }

    .row-lux:hover {
      background-color: #f8fafc;
    }

    .table tbody td {
      padding: 1.25rem 1rem;
      border-bottom: 1px solid #fcfdfe;
    }

    .item-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .avatar-soft-lux {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.75rem;
    }

    .date-lux {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }

    .price-lux {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--primary-color);
    }

    .payment-method-lux {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      display: flex;
      align-items: center;
    }

    .badge-status-lux {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.8rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .badge-status-lux .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    /* Estados Emisión Lux */
    .status-autorizada { background: #ecfdf5; color: #065f46; }
    .status-autorizada .dot { background: #10b981; }

    .status-borrador { background: #f1f5f9; color: #475569; }
    .status-borrador .dot { background: #94a3b8; }

    .status-anulada { background: #fef2f2; color: #991b1b; }
    .status-anulada .dot { background: #ef4444; }

    .status-proceso { background: #eff6ff; color: #1e40af; }
    .status-proceso .dot { background: #3b82f6; }

    .status-devuelta { background: #fffbeb; color: #92400e; }
    .status-devuelta .dot { background: #f59e0b; }

    .status-rechazada { background: #fff7ed; color: #c2410c; }
    .status-rechazada .dot { background: #ea580c; }

    .status-error { background: #fef2f2; color: #991b1b; border: 1px dashed #fca5a5; }
    .status-error .dot { background: #ef4444; }

    /* Estados Pago Lux */
    .payment-pendiente { background: #fff7ed; color: #9a3412; }
    .payment-pagado { background: #ecfdf5; color: #047857; }
    .payment-parcial { background: #eff6ff; color: #1e40af; }
    .payment-anulado { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }

    .btn-trigger-lux {
      background: transparent;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      color: #94a3b8;
      transition: all 0.2s;
    }

    .btn-trigger-lux:hover, .btn-trigger-lux[aria-expanded="true"] {
      background: #f1f5f9;
      color: var(--primary-color);
    }

    .dropdown-menu {
      z-index: 9999 !important;
      min-width: 200px;
      border: 1px solid #e2e8f0 !important;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      padding: 0.6rem 1rem;
      font-size: 0.825rem;
      font-weight: 700;
      color: #475569;
      border-radius: 10px;
      margin-bottom: 2px;
    }

    .dropdown-item:hover {
      background: #f8fafc;
      color: var(--primary-color);
    }

    .icon-item {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    .bg-soft-primary { background: #eef2ff; color: #4f46e5; }
    .bg-soft-success { background: #ecfdf5; color: #10b981; }
    .bg-soft-danger { background: #fef2f2; color: #ef4444; }
    .bg-soft-info { background: #f0f9ff; color: #0ea5e9; }
    .bg-soft-warning { background: #fffbeb; color: #f59e0b; }
    .bg-soft-secondary { background: #f1f5f9; color: #64748b; }

    .empty-icon-bg {
      width: 64px;
      height: 64px;
      background: #f8fafc;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: #cbd5e1;
    }

    .fw-800 { font-weight: 800; }
  `]
})
export class FacturaTableComponent {
  @Input() facturas: Factura[] = [];
  @Input() pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };
  @Input() processingStates: Map<string, 'consultar' | 'emitir'> = new Map();

  @Output() onAction = new EventEmitter<{ type: string, factura: Factura }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'BORRADOR': return 'status-borrador';
      case 'AUTORIZADA': return 'status-autorizada';
      case 'ANULADA': return 'status-anulada';
      case 'EN_PROCESO': return 'status-proceso';
      case 'DEVUELTA': return 'status-devuelta';
      case 'NO_AUTORIZADA': return 'status-rechazada';
      case 'ERROR_TECNICO': return 'status-error';
      default: return '';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'PENDIENTE': return 'payment-pendiente';
      case 'PAGADO': return 'payment-pagado';
      case 'PARCIAL': return 'payment-parcial';
      case 'ANULADO': return 'payment-anulado';
      default: return '';
    }
  }

  getFormaPagoString(codigo: string): string {
    switch (codigo) {
      case '01': return 'Efectivo';
      case '15': return 'Compens. Deudas';
      case '16': return 'T. Débito';
      case '17': return 'Dinero Electrónico';
      case '18': return 'T. Prepago';
      case '19': return 'T. Crédito';
      case '20': return 'Otros S.F.';
      case '21': return 'Endoso Títulos';
      default: return 'No Definido';
    }
  }

  canAnular(factura: Factura): boolean {
    return factura.estado === 'AUTORIZADA';
  }

  canEliminar(factura: Factura): boolean {
    return factura.estado === 'BORRADOR';
  }
}
