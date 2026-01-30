import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteUsuario } from '../services/clientes.service';

@Component({
  selector: 'app-clientes-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-premium-container animate__animated animate__fadeIn">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th class="ps-4">Usuario</th>
              <th>Empresa</th>
              <th class="text-center">Rol</th>
              <th>Creado Por</th>
              <th class="text-center">Estado</th>
              <th class="text-end pe-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of usuarios">
              <td class="ps-4">
                <div class="d-flex align-items-center gap-3">
                  <div class="avatar-circle">
                    {{ u.nombre.charAt(0) }}
                  </div>
                  <div class="d-flex flex-column">
                    <span class="fw-bold text-dark">{{ u.nombre }}</span>
                    <span class="text-muted small">{{ u.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="company-badge">
                  <i class="bi bi-building me-2"></i>
                  {{ u.empresa_nombre }}
                </div>
              </td>
              <td class="text-center">
                <span class="role-badge" [class.admin]="u.role === 'ADMIN'">
                  {{ u.role }}
                </span>
              </td>
              <td>
                <div class="creator-info">
                  <div class="creator-avatar" [class.vendor]="u.vendedor_id">
                    <i class="bi" [ngClass]="u.vendedor_id ? 'bi-shop' : 'bi-person-badge'"></i>
                  </div>
                  <div class="d-flex flex-column">
                    <span class="creator-name">{{ u.creado_por_nombre }}</span>
                    <span class="creator-type">
                        {{ u.vendedor_id ? 'Vendedor' : 'Colaborador' }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="text-center">
                <span class="status-indicator" [class.active]="u.estado === 'ACTIVO'">
                  {{ u.estado }}
                </span>
              </td>
              <td class="text-end pe-4">
                <div class="actions-group">
                  <button (click)="onViewDetails.emit(u)" class="btn-action" title="Ver Detalles">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn-action danger" title="Desactivar">
                    <i class="bi bi-person-x"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-premium-container {
      background: white; border-radius: 20px; border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02); overflow: hidden;
    }
    .table thead th {
      background: #f8fafc; color: #64748b; font-size: 0.75rem;
      font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 1.25rem 1rem; border: none;
    }
    .table tbody tr { transition: all 0.2s; border-bottom: 1px solid #f1f5f9; }
    .table tbody tr:hover { background: #f8fafc; }
    
    .avatar-circle {
      width: 40px; height: 40px; background: #eef2ff; color: #4f46e5;
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-weight: 800; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.1);
    }
    
    .company-badge {
      display: inline-flex; align-items: center; padding: 0.4rem 0.8rem;
      background: #f1f5f9; border-radius: 10px; font-weight: 600; color: #475569; font-size: 0.85rem;
    }
    
    .role-badge {
      padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.7rem; font-weight: 800;
      background: #f1f5f9; color: #64748b;
    }
    .role-badge.admin { background: #fee2e2; color: #ef4444; }
    
    .creator-info { display: flex; align-items: center; gap: 10px; }
    .creator-avatar {
      width: 32px; height: 32px; border-radius: 8px; background: #f1f5f9;
      display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 0.9rem;
    }
    .creator-avatar.vendor { background: #fff7ed; color: #f97316; }
    .creator-name { font-size: 0.85rem; font-weight: 700; color: #1e293b; line-height: 1.2; }
    .creator-type { font-size: 0.7rem; font-weight: 600; color: #94a3b8; }
    
    .status-indicator {
      padding: 0.35rem 0.75rem; border-radius: 10px; font-size: 0.7rem; font-weight: 800;
      background: #fef2f2; color: #ef4444; position: relative; padding-left: 1.5rem;
    }
    .status-indicator.active { background: #f0fdf4; color: #16a34a; }
    .status-indicator::before {
      content: ''; position: absolute; left: 0.6rem; top: 50%; transform: translateY(-50%);
      width: 6px; height: 6px; border-radius: 50%; background: currentColor;
    }
    
    .actions-group { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-action {
      width: 34px; height: 34px; border-radius: 10px; border: 1px solid #e2e8f0;
      background: white; color: #64748b; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; cursor: pointer;
    }
    .btn-action:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
    .btn-action.danger:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
  `]
})
export class ClientesTableComponent {
  @Input() usuarios: ClienteUsuario[] = [];
  @Output() onViewDetails = new EventEmitter<ClienteUsuario>();
}
