import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../../../../domain/models/cliente.model';

@Component({
    selector: 'app-cliente-table',
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
                <th style="width: 130px">Identificación</th>
                <th style="width: 130px">Estado</th>
                <th style="width: 180px">📧 Contacto</th>
                <th style="width: 140px">💳 Crédito</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cliente of clientes">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-3" [style.background]="getAvatarColor(cliente.razon_social, 0.1)" [style.color]="getAvatarColor(cliente.razon_social, 1)">
                      {{ getInitials(cliente.razon_social) }}
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block mb-0">{{ cliente.razon_social }}</span>
                      <small class="text-muted" style="font-size: 0.75rem;">{{ cliente.nombre_comercial || 'N/A' }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-600 text-dark" style="font-size: 0.85rem;">{{ cliente.identificacion }}</span>
                    <small class="text-muted" style="font-size: 0.7rem;">{{ cliente.tipo_identificacion }}</small>
                  </div>
                </td>
                <td>
                  <span class="badge-status-premium" [ngClass]="cliente.activo ? 'activo' : 'inactivo'">
                    {{ cliente.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="text-dark" style="font-size: 0.85rem;">{{ cliente.email || 'Sin email' }}</span>
                    <small class="text-muted" style="font-size: 0.75rem;">{{ cliente.telefono || '-' }}</small>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-bold text-dark" style="font-size: 0.85rem;">{{ cliente.limite_credito | currency:'USD' }}</span>
                    <small class="text-muted" style="font-size: 0.7rem;">{{ cliente.dias_credito }} días</small>
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
                    <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + cliente.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view', cliente})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'edit', cliente})">
                          <i class="bi bi-pencil-square text-corporate"></i>
                          <span class="ms-2">Editar Cliente</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2 text-danger" href="javascript:void(0)" (click)="onAction.emit({type: 'delete', cliente})">
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

          <div *ngIf="clientes.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-3"></i>
            No se encontraron clientes registrados.
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
    .table-responsive-premium { overflow: overflow: visible !important; position: relative; }
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
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.85rem;
    }
    
    .badge-status-premium {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.7rem; font-weight: 800;
      text-transform: uppercase;
    }
    .badge-status-premium.activo { background: #dcfce7; color: #15803d; }
    .badge-status-premium.inactivo { background: #fee2e2; color: #b91c1c; }

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
  `]
})
export class ClienteTableComponent {
    @Input() clientes: Cliente[] = [];
    @Output() onAction = new EventEmitter<{ type: string, cliente: Cliente }>();

    getInitials(name: string): string {
        if (!name) return '??';
        return name
            .split(' ')
            .slice(0, 2)
            .map(n => n[0])
            .join('')
            .toUpperCase();
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
}
