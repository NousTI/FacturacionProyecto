import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaPaginacionComponent, PaginationState } from '../../../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-vendedor-comisiones-table',
  standalone: true,
  imports: [CommonModule, EmpresaPaginacionComponent],
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 250px">Vendedor</th>
                <th style="width: 200px">Concepto</th>
                <th style="width: 150px">Monto</th>
                <th class="text-center" style="width: 130px">Generado</th>
                <th class="text-center" style="width: 140px">Estado</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let comision of comisiones">
                <td>
                  <div class="d-flex align-items-center" style="max-width: 230px;">
                    <div class="avatar-soft-premium me-2">
                       {{ (comision.vendedor_nombre || '??').substring(0, 2).toUpperCase() }}
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate" [title]="comision.vendedor_nombre">{{ comision.vendedor_nombre }}</span>
                      <small class="text-muted font-mono" style="font-size: 0.7rem;">ID: {{ comision.id.substring(0, 8) }}</small>
                    </div>
                  </div>
                </td>
                
                <td>
                  <span class="text-dark fw-600" style="font-size: 0.85rem;">{{ comision.concepto }}</span>
                </td>
                
                <td>
                  <div class="d-flex flex-column">
                    <span class="text-dark fw-bold" style="font-size: 0.9rem;">{{ comision.monto | currency:'USD' }}</span>
                    <small class="text-muted" style="font-size: 0.7rem;">{{ comision.porcentaje_aplicado }}% aplicado</small>
                  </div>
                </td>
                
                <td class="text-center">
                   <span class="text-muted fw-700" style="font-size: 0.75rem;">{{ comision.fecha_generacion | date:'dd MMM, yyyy' | uppercase }}</span>
                </td>
                
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="getStatusClass(comision.estado)">
                    {{ comision.estado }}
                  </span>
                </td>
                
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + comision.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-bs-popper-config='{"strategy":"fixed"}'
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + comision.id">
                        <li>
                          <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view_details', comision: comision})">
                            <i class="bi bi-eye text-corporate"></i>
                            <span class="ms-2">Ver Detalles</span>
                          </a>
                        </li>
                        <li>
                          <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view_logs', comision: comision})">
                            <i class="bi bi-clock-history text-corporate"></i>
                            <span class="ms-2">Ver Logs</span>
                          </a>
                        </li>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="comisiones.length === 0">
                <td colspan="6" class="text-center p-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                  No se encontraron comisiones registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <app-empresa-paginacion
        [pagination]="pagination"
        (pageChange)="pageChange.emit($event)"
        (pageSizeChange)="pageSizeChange.emit($event)"
      ></app-empresa-paginacion>
    </section>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
    }
    .module-table { 
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin-top: 0; 
    }
    .table-container {
      background: var(--bg-main, #ffffff);
      border-radius: 20px;
      border: 1px solid var(--border-color, #f1f5f9);
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: auto;
      max-height: 100%;
      overflow: hidden;
      margin-bottom: 0;
    }
    .table-responsive-premium { 
      flex: 1;
      overflow-y: auto; 
      overflow-x: auto;
      position: relative; 
    }
    .table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
    }
    .table thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bg-main, #ffffff);
      padding: 1rem 1.5rem;
      font-size: var(--text-base, 0.75rem);
      color: #0f172a;
      font-weight: 600;
      border-bottom: 2px solid var(--border-color, #f1f5f9);
      vertical-align: middle;
      text-transform: none;
      letter-spacing: normal;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-muted, #475569);
      font-size: var(--text-md, 0.85rem);
    }
    
    .avatar-soft-premium {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.95rem;
      background: var(--primary-color, #161d35);
      color: #ffffff;
      flex-shrink: 0;
    }
    
    .badge-status-premium {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 700;
      display: inline-block;
      text-transform: uppercase;
    }
    .badge-status-premium.success { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-premium.orange { background: var(--status-orange-bg); color: var(--status-orange-text); }
    .badge-status-premium.danger { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .badge-status-premium.warning { background: var(--status-warning-bg); color: var(--status-warning-text); }

    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #f8fafc; color: #0f172a;
    }
    
    .dropdown-menu {
      border: 1px solid var(--border-color, #e2e8f0) !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 1050 !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted, #475569); padding: 0.5rem 1rem;
      display: flex; align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover { background: #f8fafc; color: #0f172a; }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    
    .fw-600 { font-weight: 600; }
    .fw-700 { font-weight: 700; }
    .text-corporate { color: var(--primary-color, #111827) !important; }
    .font-mono { font-family: 'DM Mono', monospace; }
  `]

})
export class VendedorComisionesTableComponent {
  @Input() comisiones: any[] = [];
  @Input() pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };
  @Output() onAction = new EventEmitter<{ type: string, comision: any }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  getStatusClass(status: string): string {
    switch (status) {
      case 'APROBADA': return 'warning';
      case 'PENDIENTE': return 'orange';
      case 'RECHAZADA': return 'danger';
      case 'PAGADA': return 'success';
      default: return '';
    }
  }
}
