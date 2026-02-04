import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteUsuario } from '../services/clientes.service';

@Component({
  selector: 'app-clientes-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-surface shadow-premium">
      <div class="table-responsive-premium">
        <table class="table mb-0 align-middle">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email / Teléfono</th>
              <th>Empresa</th>
              <th class="text-center">Origen</th>
              <th>Rol</th>
              <th class="text-center">Estado</th>
              <th class="text-end" style="width: 80px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cliente of usuarios">
              <td>
                <div class="d-flex align-items-center">
                  <div class="cliente-avatar me-3">
                    {{ cliente.nombres[0] }}{{ cliente.apellidos[0] }}
                  </div>
                  <div class="d-flex flex-column">
                    <span class="cliente-name">{{ cliente.nombres }} {{ cliente.apellidos }}</span>
                    <small class="text-muted" style="font-size: 0.7rem;">ID: {{ cliente.id.slice(0,8) }}</small>
                  </div>
                </div>
              </td>
              <td>
                <div class="fw-semibold">{{ cliente.email }}</div>
                <small class="text-muted">{{ cliente.telefono }}</small>
              </td>
              <td>
                <span class="badge bg-light text-dark border">{{ cliente.empresa_nombre }}</span>
              </td>
              <td class="text-center">
                <div [ngClass]="getOrigenClass(cliente.origen_creacion)" class="badge-origen">
                    <i class="bi" [ngClass]="getOrigenIcon(cliente.origen_creacion)"></i>
                    {{ (cliente.origen_creacion || 'sistema') | uppercase }}
                </div>
              </td>
              <td>
                <span class="text-muted">{{ cliente.rol_nombre }}</span>
              </td>
              <td class="text-center">
                <span class="status-badge" [class.active]="cliente.activo" [class.inactive]="!cliente.activo">
                  {{ cliente.activo ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </td>
              <td class="text-end">
                <div class="dropdown">
                  <button class="btn-action-trigger" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-three-dots"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4">
                    <li>
                      <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'view', cliente: cliente})">
                        <i class="bi bi-eye text-primary me-2"></i> Ver Detalles
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'reassign', cliente: cliente})">
                        <i class="bi bi-arrow-repeat text-secondary me-2"></i> Reasignar Empresa
                      </a>
                    </li>
                    <li><hr class="dropdown-divider mx-2"></li>
                    <li>
                      <a class="dropdown-item rounded-3 py-2" [class.text-danger]="cliente.activo" (click)="onAction.emit({type: 'toggle', cliente: cliente})">
                        <i class="bi me-2" [class]="cliente.activo ? 'bi-toggle-off text-danger' : 'bi-toggle-on text-success'"></i>
                        {{ cliente.activo ? 'Desactivar' : 'Activar' }}
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item rounded-3 py-2 text-danger" (click)="onAction.emit({type: 'delete', cliente: cliente})">
                        <i class="bi bi-trash text-danger me-2"></i> Eliminar
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
            <tr *ngIf="usuarios.length === 0">
              <td colspan="6" class="text-center py-5 text-muted">
                No se encontraron clientes registrados.
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
    
    .cliente-avatar {
      width: 42px; height: 42px;
      background: #161d35; color: white;
      border-radius: 12px; display: flex;
      align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.85rem;
    }
    .cliente-name { 
      font-weight: 700; 
      color: #1e293b; 
      font-size: 0.95rem; 
    }
    
    /* Origin Badge */
    .badge-origen {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        font-size: 0.55rem;
        font-weight: 800;
        text-transform: uppercase;
    }
    .badge-origen.superadmin { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-origen.vendedor { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
    .badge-origen.sistema { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .status-badge {
      padding: 0.4rem 0.85rem; 
      border-radius: 100px;
      font-size: 0.7rem; 
      font-weight: 800;
    }
    .status-badge.active { 
      background: #dcfce7; 
      color: #15803d; 
    }
    .status-badge.inactive { 
      background: #fee2e2; 
      color: #b91c1c; 
    }

    .btn-action-trigger {
      background: #f8fafc; 
      border: none;
      width: 32px; 
      height: 32px;
      border-radius: 8px; 
      color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover { 
      background: #161d35; 
      color: white; 
    }

    .dropdown-menu {
      min-width: 200px;
      border: 1px solid #e2e8f0 !important;
      z-index: 10005 !important;
      margin-top: 5px !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.15) !important;
    }
    .dropdown-item {
      font-size: 0.85rem; 
      font-weight: 600;
      color: #475569; 
      cursor: pointer;
    }
    .dropdown-item:hover { 
      background: #f8fafc; 
      color: #161d35; 
    }
    .shadow-premium { 
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04); 
    }
    .shadow-premium-lg { 
      box-shadow: 0 20px 40px -15px rgba(0, 10, 30, 0.15); 
    }
  `]
})
export class ClientesTableComponent {
  @Input() usuarios: ClienteUsuario[] = [];
  @Output() onAction = new EventEmitter<{ type: string, cliente: ClienteUsuario }>();

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
