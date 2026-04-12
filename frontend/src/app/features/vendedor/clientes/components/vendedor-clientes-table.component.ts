import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vendedor-clientes-table',
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
                <th style="width: 180px">Empresa</th>
                <th style="width: 130px; text-align: center;">Origen</th>
                <th style="width: 150px">Rol</th>
                <th style="width: 130px; text-align: center;">Estado</th>
                <th style="width: 160px">Último Acceso</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cliente of clientes">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-3" 
                         [style.background]="getAvatarColor(cliente.nombres + ' ' + cliente.apellidos, 0.1)" 
                         [style.color]="getAvatarColor(cliente.nombres + ' ' + cliente.apellidos, 1)">
                      {{ getInitials(cliente.nombres + ' ' + cliente.apellidos) }}
                    </div>
                    <div class="text-truncate" style="max-width: 180px;">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate">{{ cliente.nombres }} {{ cliente.apellidos }}</span>
                      <small class="text-muted d-block text-truncate" style="font-size: 0.72rem;">{{ cliente.email }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="text-corporate fw-700" style="font-size: 0.85rem;">{{ cliente.empresa_nombre || 'N/A' }}</span>
                </td>
                <td class="text-center">
                   <div [ngClass]="getOrigenClass(cliente.origen_creacion)" class="badge-origen-premium">
                      <i class="bi" [ngClass]="getOrigenIcon(cliente.origen_creacion)"></i>
                      {{ (cliente.origen_creacion || 'sistema') }}
                   </div>
                </td>
                <td>
                  <span class="badge-role-premium">
                    {{ cliente.rol_nombre || 'Sin Rol' }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="cliente.activo ? 'activo' : 'inactivo'">
                    {{ cliente.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-600 text-muted" style="font-size: 0.82rem;">
                      {{ cliente.ultimo_acceso ? (cliente.ultimo_acceso | date:'dd/MM/yyyy HH:mm') : 'Sin registro' }}
                    </span>
                  </div>
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
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" 
                        [attr.aria-labelledby]="'actions-' + cliente.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" 
                           (click)="onAction.emit({type: 'view_details', cliente})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Detalles Completos</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <div class="px-3 py-1 text-muted" style="font-size: 0.65rem;">
                          <i class="bi bi-lock-fill me-1"></i> Solo lectura (Vendedor)
                        </div>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="clientes.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-person-x fs-1 d-block mb-3"></i>
            No se encontraron usuarios para mostrar.
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
    }
    .module-table { 
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .table-container {
      background: var(--bg-main, #ffffff);
      border-radius: 20px;
      border: 1px solid var(--border-color, #f1f5f9);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    .table-responsive-premium { 
      flex: 1;
      overflow-y: auto; 
      overflow-x: auto;
      position: relative; 
    }
    .table thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bg-main, #ffffff);
      padding: 1rem 1.25rem;
      font-size: var(--text-base);
      color: #0f172a;
      font-weight: 600;
      border-bottom: 2px solid var(--border-color, #f1f5f9);
      vertical-align: middle;
    }
    .table tbody td {
      padding: 1.25rem 1.25rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-muted, #475569);
      font-size: var(--text-md);
      vertical-align: middle;
    }
    
    .avatar-soft-premium {
      width: 36px; height: 36px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.85rem;
    }
    
    .badge-status-premium {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: var(--text-sm);
      font-weight: 600;
      display: inline-block;
      text-transform: uppercase;
    }
    .badge-status-premium.activo { background: var(--status-success-bg, #dcfce7); color: var(--status-success-text, #ffffff); }
    .badge-status-premium.inactivo { background: var(--status-danger-bg, #fee2e2); color: var(--status-danger-text, #ffffff); }

    .badge-role-premium {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: var(--text-sm);
      font-weight: 600;
      background: #f1f5f9;
      color: #1e293b;
      display: inline-block;
    }

    .badge-origen-premium {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    .badge-origen-premium.superadmin { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-origen-premium.vendedor { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
    .badge-origen-premium.sistema { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    
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
  `]
})
export class VendedorClientesTableComponent {
  @Input() clientes: any[] = [];
  @Output() onAction = new EventEmitter<{ type: string, cliente: any }>();

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getAvatarColor(name: string, opacity: number): string {
    const colors = [
      `rgba(99, 102, 241, ${opacity})`, `rgba(16, 185, 129, ${opacity})`,
      `rgba(245, 158, 11, ${opacity})`, `rgba(239, 68, 68, ${opacity})`,
      `rgba(139, 92, 246, ${opacity})`
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
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
