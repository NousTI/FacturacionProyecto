import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vendedor-clientes-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="module-table">
      <div class="table-container border-0 shadow-premium">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Cliente</th>
                <th style="width: 150px">Empresa</th>
                <th style="width: 120px" class="text-center">Origen</th>
                <th style="width: 150px">Rol</th>
                <th style="width: 110px">Estado</th>
                <th style="width: 150px">Acceso</th>
                <th class="text-end" style="width: 60px">Acciones</th>
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
                    <div>
                      <span class="fw-bold text-dark d-block mb-0">{{ cliente.nombres }} {{ cliente.apellidos }}</span>
                      <small class="text-muted" style="font-size: 0.7rem;">{{ cliente.email }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="text-corporate fw-800" style="font-size: 0.8rem;">{{ cliente.empresa_nombre || 'N/A' }}</span>
                </td>
                <td class="text-center">
                   <div [ngClass]="getOrigenClass(cliente.origen_creacion)" class="badge-origen">
                      <i class="bi" [ngClass]="getOrigenIcon(cliente.origen_creacion)"></i>
                      {{ (cliente.origen_creacion || 'sistema') | uppercase }}
                   </div>
                </td>
                <td>
                  <span class="badge-role-premium">
                    {{ cliente.rol_nombre || 'Sin Rol' }}
                  </span>
                </td>
                <td>
                  <span class="badge-status-premium" [ngClass]="cliente.activo ? 'activo' : 'inactivo'">
                    {{ cliente.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-bold" style="font-size: 0.85rem;">
                      {{ cliente.ultimo_acceso ? (cliente.ultimo_acceso | date:'dd/MM/yyyy HH:mm') : 'Nunca' }}
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
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4" 
                        [attr.aria-labelledby]="'actions-' + cliente.id">
                      <!-- VIEW DETAILS -->
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" 
                           (click)="onAction.emit({type: 'view_details', cliente})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="clientes.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-3"></i>
            No se encontraron clientes.
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .module-table { margin-top: 1rem; }
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
    .table tbody td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f8fafc; }
    
    .avatar-soft-premium {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.85rem;
    }
    
    .badge-status-premium {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
    }
    .badge-status-premium.activo { background: #dcfce7; color: #15803d; }
    .badge-status-premium.inactivo { background: #fee2e2; color: #b91c1c; }

    .badge-role-premium {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.7rem; font-weight: 700;
      background: rgba(22, 29, 53, 0.05);
      color: #161d35;
    }
    
    .btn-action-trigger {
      background: #f8fafc; border: none; width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8; transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #161d35; color: #ffffff;
    }
    
    .dropdown-menu {
      z-index: 100000 !important;
      min-width: 220px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.25) !important;
      padding: 0.75rem !important;
      position: fixed !important;
    }
    .dropdown-item {
      font-size: 0.85rem; font-weight: 600; color: #475569;
      padding: 0.65rem 1rem; display: flex; align-items: center;
      border-radius: 10px !important;
    }
    .dropdown-item:hover { background: #f8fafc; color: #161d35; }
    .dropdown-item i { font-size: 1.1rem; }
    .dropdown-item.text-danger:hover { background: #fee2e2; color: #b91c1c; }

    .fw-800 { font-weight: 800; }
    .text-corporate { color: #161d35 !important; }
    .shadow-premium { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04); }

    /* Origin Badge */
    .badge-origen {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        font-size: 0.5rem;
        font-weight: 800;
        text-transform: uppercase;
    }
    .badge-origen.superadmin { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-origen.vendedor { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
    .badge-origen.sistema { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
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
