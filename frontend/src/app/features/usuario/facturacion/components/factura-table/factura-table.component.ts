import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Factura } from '../../../../../domain/models/factura.model';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-factura-table',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <section class="module-table">
      <div class="table-container border-0 shadow-premium">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado Emisión</th>
                <th>Estado Pago</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let factura of facturas">
                <!-- Numero y Secuencial -->
                <td>
                   <div class="d-flex flex-column">
                    <span class="fw-bold text-dark" style="font-size: 0.9rem;">{{ factura.numero_factura || 'BORRADOR' }}</span>
                    <small *ngIf="factura.numero_autorizacion" class="text-muted" style="font-size: 0.7rem;" title="{{factura.numero_autorizacion}}">
                      {{ factura.numero_autorizacion | slice:0:10 }}...
                    </small>
                  </div>
                </td>

                <!-- Cliente -->
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-2" [style.background]="getAvatarColor(factura.snapshot_cliente?.razon_social || 'C', 0.1)" [style.color]="getAvatarColor(factura.snapshot_cliente?.razon_social || 'C', 1)">
                      {{ getInitials(factura.snapshot_cliente?.razon_social || 'Cliente') }}
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block mb-0">{{ factura.snapshot_cliente?.razon_social || 'N/A' }}</span>
                      <small class="text-muted" style="font-size: 0.75rem;">{{ factura.snapshot_cliente?.identificacion || 'N/A' }}</small>
                    </div>
                  </div>
                </td>

                <!-- Fecha -->
                <td>
                  <span class="text-dark" style="font-size: 0.85rem;">{{ factura.fecha_emision | date:'dd MMM yyyy' }}</span>
                </td>

                 <!-- Total -->
                <td>
                  <span class="fw-bold text-dark" style="font-size: 0.9rem;">{{ factura.total | currency:'USD' }}</span>
                </td>

                <!-- Estado Emisión -->
                <td>
                  <span class="badge-status-premium" [ngClass]="getStatusClass(factura.estado)">
                    {{ factura.estado }}
                  </span>
                </td>

                 <!-- Estado Pago -->
                 <td>
                  <span class="badge-status-premium" [ngClass]="getPaymentStatusClass(factura.estado_pago)">
                    {{ factura.estado_pago }}
                  </span>
                </td>

                <!-- Acciones -->
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + factura.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + factura.id">
                      
                      <!-- VER -->
                      <li> 
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view', factura})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>

                      <!-- EDITAR (Solo si es Borrador) -->
                      <li *ngIf="factura.estado === 'BORRADOR'">
                        <a 
                          *appHasPermission="'FACTURAS_EDITAR'"
                          class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'edit', factura})">
                          <i class="bi bi-pencil-square text-corporate"></i>
                          <span class="ms-2">Editar</span>
                        </a>
                      </li>

                      <!-- SRI (Borrador, Devuelta o Error Técnico) -->
                       <li *ngIf="['BORRADOR', 'DEVUELTA', 'ERROR_TECNICO'].includes(factura.estado)">
                        <a 
                          *appHasPermission="'FACTURAS_ENVIAR_SRI'"
                          class="dropdown-item rounded-3 py-2 text-primary" href="javascript:void(0)" (click)="onAction.emit({type: 'sri', factura})">
                          <i class="bi bi-cloud-upload"></i>
                          <span class="ms-2">Enviar al SRI</span>
                        </a>
                      </li>

                      <!-- CONSULTAR SRI (Solo si está EN_PROCESO) -->
                      <li *ngIf="factura.estado === 'EN_PROCESO'">
                        <a 
                          *appHasPermission="'FACTURAS_ENVIAR_SRI'"
                          class="dropdown-item rounded-3 py-2 text-info" href="javascript:void(0)" (click)="onAction.emit({type: 'consultar', factura})">
                          <i class="bi bi-arrow-clockwise"></i>
                          <span class="ms-2">Consultar SRI</span>
                        </a>
                      </li>
                      
                       <!-- PDF (Si es Autorizada o Anulada) -->
                       <li *ngIf="factura.estado === 'AUTORIZADA' || factura.estado === 'ANULADA'">
                        <a 
                          *appHasPermission="'FACTURAS_DESCARGAR_PDF'"
                          class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'pdf', factura})">
                          <i class="bi bi-file-earmark-pdf text-danger"></i>
                          <span class="ms-2">Descargar PDF</span>
                        </a>
                      </li>

                      <!-- EMAIL (Si es Autorizada) -->
                                             <li *ngIf="factura.estado === 'AUTORIZADA' || factura.estado === 'ANULADA'">

                        <a 
                          *appHasPermission="'FACTURAS_ENVIAR_EMAIL'"
                          class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'email', factura})">
                          <i class="bi bi-envelope"></i>
                          <span class="ms-2">Enviar Email</span>
                        </a>
                      </li>

                      <li><hr class="dropdown-divider mx-2"></li>

                      <!-- ANULAR (Si es Autorizada) -->
                      <li *ngIf="factura.estado === 'AUTORIZADA'">
                        <a 
                          *appHasPermission="'FACTURAS_ANULAR'"
                          class="dropdown-item rounded-3 py-2 text-danger" href="javascript:void(0)" (click)="onAction.emit({type: 'anular', factura})">
                          <i class="bi bi-x-circle"></i>
                          <span class="ms-2">Anular</span>
                        </a>
                      </li>
                      
                       <!-- ELIMINAR (Solo si es Borrador) -->
                      <li *ngIf="factura.estado === 'BORRADOR'">
                        <a 
                          *appHasPermission="'FACTURAS_EDITAR'"
                          class="dropdown-item rounded-3 py-2 text-danger" href="javascript:void(0)" (click)="onAction.emit({type: 'delete', factura})">
                          <i class="bi bi-trash"></i>
                          <span class="ms-2">Eliminar</span>
                        </a>
                      </li>

                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="facturas.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-receipt fs-1 d-block mb-3"></i>
            No se encontraron facturas registradas.
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .module-table { margin-top: 1.5rem; }
    .table-container {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      overflow: visible !important;
    }
    .table-responsive-premium { overflow: visible !important; position: relative; }
    .table thead th {
      background: #f8fafc;
      padding: 1.15rem 1.5rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 800;
      border-bottom: 2px solid #f1f5f9;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f8fafc;
    }
    
    .avatar-soft-premium {
      width: 32px; height: 32px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.75rem;
    }
    
    .badge-status-premium {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.7rem; font-weight: 800;
      text-transform: uppercase;
    }
    
    .btn-action-trigger {
      background: #f8fafc; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #161d35; color: #ffffff;
    }
    
    .dropdown-menu {
      z-index: 1000;
      min-width: 200px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.2) !important;
      padding: 0.75rem !important;
    }
    .dropdown-item {
      font-size: 0.85rem; font-weight: 600;
      color: #475569; padding: 0.65rem 1rem;
      display: flex; align-items: center;
      border-radius: 10px !important;
    }
    .dropdown-item:hover { background: #f8fafc; color: #161d35; }
    .dropdown-item i { font-size: 1.1rem; }
    
    .fw-800 { font-weight: 800; }
    .fw-600 { font-weight: 600; }
    .text-corporate { color: #161d35 !important; }
    .shadow-premium { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04); }

    /* Custom Status Colors */
    .status-borrador { background: #f1f5f9; color: #64748b; }
    .status-autorizada { background: #dcfce7; color: #15803d; }
    .status-anulada { background: #fee2e2; color: #b91c1c; }
    .status-proceso { background: #e0f2fe; color: #0369a1; }
    .status-devuelta { background: #fef3c7; color: #92400e; }
    .status-rechazada { background: #fff7ed; color: #c2410c; }
    .status-error { background: #fee2e2; color: #991b1b; border: 1px dashed #f87171; }

    .payment-pendiente { background: #fff7ed; color: #c2410c; }
    .payment-pagado { background: #f0fdf4; color: #166534; }
    .payment-parcial { background: #e0f2fe; color: #0369a1; }
  `]
})
export class FacturaTableComponent {
  @Input() facturas: Factura[] = [];
  @Output() onAction = new EventEmitter<{ type: string, factura: Factura }>();

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
      case 'RECHAZADA':
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
      default: return '';
    }
  }
}
