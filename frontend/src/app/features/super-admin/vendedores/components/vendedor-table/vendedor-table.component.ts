import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vendedor } from '../../services/vendedor.service';

@Component({
  selector: 'app-vendedor-table',
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 250px">Vendedor</th>
                <th style="width: 150px" class="text-center">Estado</th>
                <th style="width: 180px" class="text-center">Empresas (Act/Tot)</th>
                <th style="width: 180px" class="text-end">Ingresos</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let v of vendedores">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-2">
                      {{ (v.nombre || '??').substring(0, 2).toUpperCase() }}
                    </div>
                    <div class="d-flex flex-column text-truncate">
                      <span class="fw-bold text-dark mb-0 text-truncate" [title]="v.nombre">{{ v.nombre }}</span>
                      <small class="text-muted text-truncate">{{ v.email }}</small>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="v.activo ? 'activo' : 'inactivo'">
                      {{ v.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="d-flex flex-column align-items-center">
                    <div class="fw-bold text-dark" style="font-size: 0.85rem;">
                        {{ v.empresasActivas }} <span class="text-muted mx-1">/</span> {{ v.empresasAsignadas }}
                    </div>
                    <!-- Progress Mini -->
                    <div class="progress-mini-track mt-1">
                        <div class="progress-mini-fill" [style.width.%]="(v.empresasActivas / (v.empresasAsignadas || 1)) * 100"></div>
                    </div>
                  </div>
                </td>
                <td class="text-end">
                  <span class="fw-bold text-dark" style="font-size: 0.95rem;">{{ v.ingresosGenerados | currency:'USD' }}</span>
                </td>
                <td class="text-end">
                  <div class="dropdown">
                    <button class="btn-action-trigger" data-bs-toggle="dropdown" aria-expanded="false" data-bs-popper-config='{"strategy":"fixed"}'>
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'view_details', vendedor: v})">
                          <i class="bi bi-eye text-corporate me-2"></i> Ver Desempeño
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'edit', vendedor: v})">
                          <i class="bi bi-pencil-square text-corporate me-2"></i> Editar Vendedor
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'reassign', vendedor: v})">
                          <i class="bi bi-arrow-repeat text-corporate me-2"></i> Reasignar Empresas
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" [class.text-danger]="v.activo" (click)="onAction.emit({type: 'toggle_status', vendedor: v})">
                          <i class="bi me-2" [ngClass]="v.activo ? 'bi-toggle-off text-muted' : 'bi-toggle-on text-corporate'"></i>
                          {{ v.activo ? 'Desactivar Acceso' : 'Activar Vendedor' }}
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2 text-danger" (click)="onAction.emit({type: 'delete', vendedor: v})">
                          <i class="bi bi-trash3 me-2"></i> Eliminar Vendedor
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="vendedores.length === 0">
                <td colspan="5" class="text-center p-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                  No se encontraron vendedores registrados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
      font-size: var(--text-base);
      color: var(--text-main, #0f172a);
      font-weight: 600;
      border-bottom: 2px solid var(--border-color, #f1f5f9);
      vertical-align: middle;
    }
    
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-muted, #64748b);
      font-size: var(--text-md);
    }

    .avatar-soft-premium {
      width: 38px; height: 38px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: var(--text-base);
      background: var(--primary-color, #161d35);
      color: #ffffff;
    }

    .badge-status-premium {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: var(--text-sm);
      font-weight: 600;
      display: inline-block;
      text-transform: uppercase;
    }
    .badge-status-premium.activo { background: var(--status-success-bg, #dcfce7); color: var(--status-success-text, #15803d); }
    .badge-status-premium.inactivo { background: var(--status-danger-bg, #fee2e2); color: var(--status-danger-text, #b91c1c); }

    .progress-mini-track {
        height: 6px; background: var(--border-color, #f1f5f9);
        border-radius: 10px; width: 60px; overflow: hidden;
    }
    .progress-mini-fill {
        height: 100%; border-radius: 10px;
        background: var(--primary-color, #161d35);
    }

    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: var(--status-neutral, #94a3b8);
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: var(--border-color, #f8fafc); color: var(--text-main, #0f172a);
    }

    .dropdown-menu {
      border: 1px solid var(--border-color, #e2e8f0) !important;
      box-shadow: none !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 1050;
    }
    .dropdown-item {
      border-radius: 8px !important;
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--text-muted, #475569); padding: 0.5rem 1rem;
      display: flex; align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover { background: var(--border-color, #f8fafc); color: var(--text-main, #0f172a); }
    .text-corporate { color: var(--primary-color, #111827) !important; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class VendedorTableComponent {
  @Input() vendedores: Vendedor[] = [];
  @Output() onAction = new EventEmitter<{ type: string, vendedor: Vendedor }>();
}
