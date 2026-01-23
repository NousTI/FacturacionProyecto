import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empresa-table',
  template: `
    <section class="module-table">
      <div class="table-container border-0 shadow-premium">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Razón Social</th>
                <th style="width: 150px">Estado</th>
                <th style="width: 150px">Plan</th>
                <th style="width: 150px">Vencimiento</th>
                <th class="text-end" style="width: 100px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let empresa of empresas" class="animate__animated animate__fadeIn">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-3">
                      {{ empresa.razonSocial.substring(0, 2).toUpperCase() }}
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block mb-0">{{ empresa.razonSocial }}</span>
                      <small class="text-muted font-mono" style="font-size: 0.75rem;">{{ empresa.ruc }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge-status-premium" [ngClass]="empresa.estado === 'ACTIVO' ? 'active' : 'inactive'">
                    {{ empresa.estado }}
                  </span>
                </td>
                <td>
                  <span class="text-corporate fw-bold" style="font-size: 0.85rem;">{{ empresa.plan }}</span>
                </td>
                <td class="text-muted" style="font-size: 0.85rem;">
                  <span [class.text-danger]="isExpired(empresa.fechaVencimiento)" [class.fw-bold]="isExpired(empresa.fechaVencimiento)">
                    {{ empresa.fechaVencimiento | date:'dd/MM/yyyy' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + empresa.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-bs-display="static"
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + empresa.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view_details', empresa})">
                          <i class="bi bi-eye text-corporate"></i>
                          <div class="ms-2 d-flex flex-column">
                            <span>Ver Detalles</span>
                          </div>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'toggle_status', empresa})">
                          <i class="bi" [ngClass]="empresa.estado === 'ACTIVO' ? 'bi-toggle-off text-muted' : 'bi-toggle-on text-corporate'"></i>
                          <span class="ms-2">{{ empresa.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }} Empresa</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'change_plan', empresa})">
                          <i class="bi bi-arrow-up-right-circle text-corporate"></i>
                          <span class="ms-2">Cambiar Plan</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'assign_vendedor', empresa})">
                          <i class="bi bi-briefcase text-muted"></i>
                          <span class="ms-2">Asignar Vendedor</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2 text-corporate fw-bold" href="javascript:void(0)" (click)="onAction.emit({type: 'support_access', empresa})">
                          <i class="bi bi-box-arrow-in-right"></i>
                          <span class="ms-2">Acceder como Empresa</span>
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
    </section>
  `,
  styles: [`
    .module-table {
      margin-top: 1rem;
    }
    .table-container {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      position: relative;
      z-index: 1;
      overflow: visible !important;
    }
    .table-responsive-premium {
      overflow: visible !important;
    }
    .table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
      margin-bottom: 0;
    }
    .table thead th {
      background: #f8fafc;
      padding: 1rem 1.5rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 800;
      border-bottom: 2px solid #f1f5f9;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .table thead th:first-child { border-top-left-radius: 24px; }
    .table thead th:last-child { border-top-right-radius: 24px; }

    .table tbody tr {
      position: relative;
    }
    .table tbody tr:focus-within,
    .table tbody tr:hover {
      z-index: 100;
    }
    .table tbody tr:has(.show),
    .table tbody tr:has(.btn-action-trigger[aria-expanded="true"]) {
      z-index: 10001 !important;
    }
    
    .table tbody td {
      padding: 1.15rem 1.5rem;
      border-bottom: 1px solid #f8fafc;
      background: transparent;
    }

    .avatar-soft-premium {
      width: 38px; height: 38px;
      background: #f1f5f9; color: #161d35;
      border-radius: 10px; display: flex;
      align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.8rem;
    }
    .badge-status-premium {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.75rem; font-weight: 800;
    }
    .badge-status-premium.active { background: #dcfce7; color: #15803d; }
    .badge-status-premium.inactive { background: #fee2e2; color: #b91c1c; }

    .btn-action-trigger {
      background: #f8fafc; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #161d35; color: #ffffff;
    }

    .dropdown {
      position: relative;
    }
    .dropdown-menu {
      z-index: 10005 !important;
      min-width: 210px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.15) !important;
      margin-top: 5px !important;
      pointer-events: auto !important;
    }
    .dropdown-item {
      font-size: 0.85rem; font-weight: 600;
      color: #475569; padding: 0.65rem 1.15rem;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    .dropdown-item:hover {
      background: #f8fafc; color: #161d35;
    }
    .dropdown-item i { font-size: 1.1rem; }
    
    .text-corporate { color: #161d35 !important; }
    .text-danger { color: #ef4444 !important; }
    .text-success { color: #22c55e !important; }
    .font-mono { font-family: 'DM Mono', monospace; }
    .shadow-premium { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04); }
    .shadow-premium-lg { box-shadow: 0 20px 40px -15px rgba(0, 10, 30, 0.15); }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class EmpresaTableComponent {
  @Input() empresas: any[] = [];
  @Output() onAction = new EventEmitter<{ type: string, empresa: any }>();

  isExpired(date: Date): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }
}
