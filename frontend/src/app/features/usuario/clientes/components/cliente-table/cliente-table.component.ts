import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../../../../domain/models/cliente.model';

@Component({
    selector: 'app-cliente-table',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="table-container-lux">
      <div class="table-responsive">
        <table class="table mb-0 align-middle">
          <thead>
            <tr>
              <th class="ps-4" style="width: 320px">Cliente</th>
              <th style="width: 160px">Identificación</th>
              <th style="width: 140px">Estado</th>
              <th style="width: 200px">Contacto</th>
              <th style="width: 160px">Crédito</th>
              <th class="text-end pe-4" style="width: 100px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cliente of clientes">
              <!-- CLIENTE INFO -->
              <td class="ps-4">
                <div class="d-flex align-items-center gap-3">
                  <div class="avatar-lux" [style.background]="getAvatarColor(cliente.razon_social, 0.1)" [style.color]="getAvatarColor(cliente.razon_social, 1)">
                    {{ getInitials(cliente.razon_social) }}
                  </div>
                  <div class="d-flex flex-column gap-1">
                    <span class="client-name-lux">{{ cliente.razon_social }}</span>
                    <span class="client-subname-lux">{{ cliente.nombre_comercial || 'N/A' }}</span>
                  </div>
                </div>
              </td>

              <!-- IDENTIFICACIÓN -->
              <td>
                <div class="d-flex flex-column">
                  <span class="id-value-lux">{{ cliente.identificacion }}</span>
                  <span class="id-type-lux">{{ cliente.tipo_identificacion }}</span>
                </div>
              </td>

              <!-- ESTADO -->
              <td>
                <div class="status-badge-lux" [ngClass]="cliente.activo ? 'activo' : 'inactivo'">
                  <span class="dot"></span>
                  {{ cliente.activo ? 'ACTIVO' : 'INACTIVO' }}
                </div>
              </td>

              <!-- CONTACTO -->
              <td>
                <div class="contact-box-lux">
                  <div class="contact-item-lux">
                    <i class="bi bi-envelope"></i>
                    <span>{{ cliente.email || '—' }}</span>
                  </div>
                  <div class="contact-item-lux" *ngIf="cliente.telefono">
                    <i class="bi bi-telephone"></i>
                    <span>{{ cliente.telefono }}</span>
                  </div>
                </div>
              </td>

              <!-- CRÉDITO -->
              <td>
                <div class="credit-box-lux">
                  <span class="credit-value-lux">{{ cliente.limite_credito | currency:'USD' }}</span>
                  <span class="credit-days-lux">{{ cliente.dias_credito }} días plazo</span>
                </div>
              </td>

              <!-- ACCIONES -->
              <td class="text-end pe-4">
                <div class="dropdown">
                  <button 
                    class="btn-table-action-lux" 
                    type="button" 
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="bi bi-three-dots"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-premium-lux border-0 p-2">
                    <li>
                      <button class="dropdown-item" (click)="onAction.emit({type: 'view', cliente})">
                        <i class="bi bi-eye"></i>
                        <span>Ver Perfil</span>
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item" (click)="onAction.emit({type: 'edit', cliente})">
                        <i class="bi bi-pencil-square"></i>
                        <span>Editar</span>
                      </button>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                      <button class="dropdown-item text-danger" (click)="onAction.emit({type: 'delete', cliente})">
                        <i class="bi bi-trash3"></i>
                        <span>Eliminar</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- EMPTY STATE -->
        <div *ngIf="clientes.length === 0" class="empty-box-lux">
          <div class="empty-icon-box-lux">
            <i class="bi bi-people"></i>
          </div>
          <h3>No hay clientes</h3>
          <p>No se encontraron clientes con los filtros aplicados.</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .table-container-lux {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      overflow: hidden;
    }

    .table thead th {
      background: #f8fafc;
      padding: 1.25rem 1rem;
      font-size: 0.75rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #f1f5f9;
    }

    .table tbody td {
      padding: 1.25rem 1rem;
      border-bottom: 1px solid #f8fafc;
    }

    .avatar-lux {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.95rem;
    }

    .client-name-lux {
      display: block;
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
    }

    .client-subname-lux {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .id-value-lux {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
    }

    .id-type-lux {
      font-size: 0.7rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge-lux {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 1rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.2px;
    }

    .status-badge-lux.activo { background: #f0fdf4; color: #16a34a; }
    .status-badge-lux.inactivo { background: #fef2f2; color: #dc2626; }

    .status-badge-lux .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .status-badge-lux.activo .dot { background: #16a34a; box-shadow: 0 0 8px rgba(22, 163, 74, 0.4); }
    .status-badge-lux.inactivo .dot { background: #dc2626; }

    .contact-box-lux {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .contact-item-lux {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: #475569;
      font-weight: 500;
    }

    .contact-item-lux i {
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .credit-box-lux {
      display: flex;
      flex-direction: column;
    }

    .credit-value-lux {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
    }

    .credit-days-lux {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
    }

    .btn-table-action-lux {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid #f1f5f9;
      background: white;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-table-action-lux:hover {
      background: #f8fafc;
      color: #161d35;
      border-color: #cbd5e1;
    }

    .dropdown-menu {
      border-radius: 16px;
      padding: 0.5rem;
      min-width: 180px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.1);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
    }

    .dropdown-item:hover {
      background: #f8fafc;
      color: #161d35;
    }

    .dropdown-item.text-danger:hover {
      background: #fef2f2;
    }

    .empty-box-lux {
      padding: 4rem 2rem;
      text-align: center;
    }

    .empty-icon-box-lux {
      width: 80px;
      height: 80px;
      background: #f8fafc;
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      color: #cbd5e1;
      margin: 0 auto 1.5rem;
    }

    .empty-box-lux h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .empty-box-lux p {
      color: #94a3b8;
      font-size: 0.9rem;
      max-width: 300px;
      margin: 0 auto;
    }
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
