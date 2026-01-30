import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vendedor } from '../../services/vendedor.service';

@Component({
  selector: 'app-vendedor-table',
  template: `
    <div class="table-surface shadow-premium">
      <div class="table-responsive-premium">
        <table class="table mb-0 align-middle">
          <thead>
            <tr>
              <th>Vendedor</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Empresas (Activas/Total)</th>
              <th class="text-end">Ingresos</th>
              <th class="text-end" style="width: 80px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of vendedores">
              <td>
                <div class="d-flex align-items-center">
                  <div class="vendedor-avatar me-3">
                    {{ v.nombre.substring(0, 2).toUpperCase() }}
                  </div>
                  <div class="d-flex flex-column">
                    <span class="vendedor-name">{{ v.nombre }}</span>
                    <small class="vendedor-email text-muted">{{ v.email }}</small>
                  </div>
                </div>
              </td>
              <td class="text-center">
                <span class="status-badge" [class.active]="v.activo" [class.inactive]="!v.activo">
                   {{ v.activo ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </td>
              <td class="text-center">
                <div class="performance-metric">
                    <span class="fw-bold text-dark">{{ v.empresasActivas }}</span>
                    <span class="text-muted mx-1">/</span>
                    <span class="text-muted">{{ v.empresasAsignadas }}</span>
                </div>
                <!-- Progress bar sutil -->
                <div class="progress-premium mt-1">
                    <div class="progress-bar-premium" [style.width.%]="(v.empresasActivas / v.empresasAsignadas) * 100"></div>
                </div>
              </td>
              <td class="text-end">
                <span class="revenue-value">{{ v.ingresosGenerados | currency }}</span>
              </td>
              <td class="text-end">
                <div class="dropdown">
                  <button class="btn-action-trigger" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-three-dots"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4">
                    <li>
                      <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'view_details', vendedor: v})">
                        <i class="bi bi-eye text-primary me-2"></i> Ver Desempeño
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'edit', vendedor: v})">
                        <i class="bi bi-pencil-square text-warning me-2"></i> Editar Vendedor
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'reassign', vendedor: v})">
                        <i class="bi bi-arrow-repeat text-secondary me-2"></i> Reasignar Empresas
                      </a>
                    </li>
                    <li><hr class="dropdown-divider mx-2"></li>
                    <li>
                      <a class="dropdown-item rounded-3 py-2" [class.text-danger]="v.activo" (click)="onAction.emit({type: 'toggle_status', vendedor: v})">
                        <i class="bi me-2" [class]="v.activo ? 'bi-lock text-danger' : 'bi-unlock text-success'"></i>
                        {{ v.activo ? 'Bloquear Vendedor' : 'Activar Vendedor' }}
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-surface {
      background: #ffffff;
      border-radius: 24px;
      overflow: visible !important;
      border: 1px solid #f1f5f9;
      position: relative;
      z-index: 5;
    }
    .table-responsive-premium { 
      overflow: visible !important; 
    }
    .table {
      border-collapse: separate;
    }
    .table tbody tr {
      position: relative;
      transition: z-index 0.2s;
    }
    /* FIX: Elevate the row when dropdown is open */
    .table tbody tr:focus-within,
    .table tbody tr:hover {
      z-index: 100;
    }
    .table tbody tr:has(.show),
    .table tbody tr:has(.btn-action-trigger[aria-expanded="true"]) {
      z-index: 10001 !important;
    }

    .table thead th {
      background: #f8fafc;
      padding: 1.25rem 1.5rem;
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #f1f5f9;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f8fafc;
      background: transparent;
    }
    .vendedor-avatar {
      width: 42px; height: 42px;
      background: #161d35; color: white;
      border-radius: 12px; display: flex;
      align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.85rem;
    }
    .vendedor-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .vendedor-email { font-size: 0.8rem; }
    
    .status-badge {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.7rem; font-weight: 800;
    }
    .status-badge.active { background: #dcfce7; color: #15803d; }
    .status-badge.inactive { background: #fee2e2; color: #b91c1c; }

    .performance-metric { font-size: 0.9rem; }
    .progress-premium {
        height: 4px; background: #f1f5f9;
        border-radius: 10px; width: 60px;
        margin: 0 auto;
    }
    .progress-bar-premium {
        height: 100%; border-radius: 10px;
        background: #161d35;
    }
    .revenue-value { font-weight: 800; color: #1e293b; }

    .btn-action-trigger {
      background: #f8fafc; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover { background: #161d35; color: white; }

    .dropdown-menu {
      min-width: 220px;
      border: 1px solid #e2e8f0 !important;
      z-index: 10005 !important;
      margin-top: 5px !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.15) !important;
    }
    .dropdown-item {
      font-size: 0.85rem; font-weight: 600;
      color: #475569; cursor: pointer;
    }
    .dropdown-item:hover { background: #f8fafc; color: #161d35; }
    .shadow-premium { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04); }
    .shadow-premium-lg { box-shadow: 0 20px 40px -15px rgba(0, 10, 30, 0.15); }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class VendedorTableComponent {
  @Input() vendedores: Vendedor[] = [];
  @Output() onAction = new EventEmitter<{ type: string, vendedor: Vendedor }>();
}
