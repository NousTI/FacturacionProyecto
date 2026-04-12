import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteUsuario } from '../services/clientes.service';

@Component({
  selector: 'app-clientes-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 250px">Cliente</th>
                <th style="width: 200px">Contacto</th>
                <th style="width: 180px">Empresa</th>
                <th class="text-center" style="width: 130px">Origen</th>
                <th style="width: 150px">Rol</th>
                <th class="text-center" style="width: 120px">Estado</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cliente of usuarios">
                <td>
                  <div class="d-flex align-items-center" style="max-width: 230px;">
                    <div class="avatar-soft-premium me-2">
                      {{ getInitials(cliente.nombres, cliente.apellidos) }}
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate" [title]="cliente.nombres + ' ' + cliente.apellidos">{{ cliente.nombres }} {{ cliente.apellidos }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="text-dark fw-600" style="font-size: 0.85rem;">{{ cliente.email }}</span>
                    <small class="text-muted" style="font-size: 0.7rem;">{{ cliente.telefono }}</small>
                  </div>
                </td>
                <td>
                  <span class="text-dark fw-600" style="font-size: 0.85rem;">{{ cliente.empresa_nombre }}</span>
                </td>
                <td class="text-center">
                  <span class="text-muted fw-700" style="font-size: 0.7rem;">{{ (cliente.origen_creacion || 'sistema') | uppercase }}</span>
                </td>
                <td>
                  <span class="text-muted fw-600" style="font-size: 0.85rem;">{{ cliente.rol_nombre }}</span>
                </td>
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="cliente.activo ? 'activo' : 'inactivo'">
                    {{ cliente.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + cliente.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-bs-popper-config='{"strategy":"fixed"}'
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + cliente.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view', cliente})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'reassign', cliente})">
                          <i class="bi bi-arrow-repeat text-corporate"></i>
                          <span class="ms-2">Reasignar Empresa</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'toggle', cliente})">
                          <i class="bi" [ngClass]="cliente.activo ? 'bi-toggle-off text-muted' : 'bi-toggle-on text-corporate'"></i>
                          <span class="ms-2">{{ cliente.activo ? 'Desactivar Cliente' : 'Activar Cliente' }}</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2 text-danger" href="javascript:void(0)" (click)="onAction.emit({type: 'delete', cliente})">
                          <i class="bi bi-trash"></i>
                          <span class="ms-2">Eliminar Cliente</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="usuarios.length === 0">
                <td colspan="7" class="text-center p-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                  No se encontraron clientes registrados.
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
      color: #0f172a;
      font-weight: 600;
      border-bottom: 2px solid var(--border-color, #f1f5f9);
      vertical-align: middle;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-muted, #475569);
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
      text-transform: capitalize;
    }
    .badge-status-premium.activo { background: var(--status-success-bg, #dcfce7); color: var(--status-success-text, #15803d); }
    .badge-status-premium.inactivo { background: var(--status-danger-bg, #fee2e2); color: var(--status-danger-text, #b91c1c); }

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
      box-shadow: none !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 1050 !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      font-size: var(--text-base);
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
  `],

})
export class ClientesTableComponent {
  @Input() usuarios: ClienteUsuario[] = [];
  @Output() onAction = new EventEmitter<{ type: string, cliente: ClienteUsuario }>();

  getInitials(nombres: string, apellidos: string): string {
    const n = nombres?.[0] || '';
    const a = apellidos?.[0] || '';
    return (n + a).toUpperCase() || '??';
  }

  getOrigenClass(origen?: string): string {
    if (!origen) return 'sistema';
    return origen.toLowerCase();
  }

  getOrigenIcon(origen?: string): string {
    switch (origen?.toLowerCase()) {
      case 'superadmin': return 'bi-shield-check';
      case 'vendedor': return 'bi-person-badge';
      default: return 'bi-cpu';
    }
  }
}
