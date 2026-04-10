import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../../../../domain/models/cliente.model';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
    selector: 'app-cliente-table',
    standalone: true,
    imports: [CommonModule, HasPermissionDirective],
    template: `
    <div class="table-responsive soft-card">
      <table class="table table-hover align-middle mb-0">
        <thead class="bg-light">
          <tr>
            <th class="ps-4">Cliente</th>
            <th>Identificación</th>
            <th>Estado</th>
            <th>Contacto</th>
            <th>Crédito</th>
            <th class="text-end pe-4">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let cliente of clientes">
            <!-- CLIENTE INFO -->
            <td class="ps-4">
              <div class="d-flex align-items-center gap-3">
                <div class="avatar-circle" [style.background]="getAvatarColor(cliente.razon_social, 0.1)" [style.color]="getAvatarColor(cliente.razon_social, 1)">
                  {{ getInitials(cliente.razon_social) }}
                </div>
                <div class="d-flex flex-column">
                  <span class="fw-bold text-dark">{{ cliente.razon_social }}</span>
                  <small class="text-muted">{{ cliente.nombre_comercial || 'N/A' }}</small>
                </div>
              </div>
            </td>

            <!-- IDENTIFICACIÓN -->
            <td>
              <div class="d-flex flex-column">
                <span class="fw-semibold">{{ cliente.identificacion }}</span>
                <small class="text-muted text-uppercase" style="font-size: 0.7rem;">{{ cliente.tipo_identificacion }}</small>
              </div>
            </td>

            <!-- ESTADO -->
            <td>
              <span class="badge" [ngClass]="cliente.activo ? 'badge-success' : 'badge-danger'">
                {{ cliente.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>

            <!-- CONTACTO -->
            <td>
              <div class="d-flex flex-column gap-1" style="font-size: 0.85rem;">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-envelope text-muted"></i>
                  <span>{{ cliente.email || '—' }}</span>
                </div>
                <div class="d-flex align-items-center gap-2" *ngIf="cliente.telefono">
                  <i class="bi bi-telephone text-muted"></i>
                  <span>{{ cliente.telefono }}</span>
                </div>
              </div>
            </td>

            <!-- CRÉDITO -->
            <td>
              <div class="d-flex flex-column">
                <span class="fw-bold text-dark">{{ (cliente.limite_credito || 0) | number:'1.2-2' }}</span>
                <small class="text-muted">{{ cliente.dias_credito }} días</small>
              </div>
            </td>

            <!-- ACCIONES -->
            <td class="text-end pe-4">
              <div class="action-buttons justify-content-end">
                <button class="btn-action view" (click)="onAction.emit({type: 'view', cliente})" title="Ver Detalles">
                  <i class="bi bi-eye"></i>
                </button>
                <button *hasPermission="'CLIENTES_EDITAR'" class="btn-action edit" (click)="onAction.emit({type: 'edit', cliente})" title="Editar">
                  <i class="bi bi-pencil"></i>
                </button>
                <button *hasPermission="'CLIENTES_ELIMINAR'" class="btn-action delete" (click)="onAction.emit({type: 'delete', cliente})" title="Eliminar">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- EMPTY STATE -->
      <div *ngIf="clientes.length === 0" class="empty-state py-5 text-center">
        <i class="bi bi-people text-muted" style="font-size: 3rem;"></i>
        <h5 class="mt-3 fw-bold">No se encontraron clientes</h5>
        <p class="text-muted small">Intenta ajustar los filtros de búsqueda</p>
      </div>
    </div>
  `,
  styles: [`
    .soft-card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); overflow: hidden; }
    
    .table th { padding: 1.25rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; border: none; font-weight: 800; color: #64748b; }
    .table td { padding: 1.1rem 1rem; border-color: #f1f5f9; }
    
    .avatar-circle {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
    }
    
    .badge { padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 600; text-transform: capitalize; font-size: 0.75rem; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-action { width: 34px; height: 34px; border: none; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; cursor: pointer; }
    .btn-action.view { background: #f8fafc; color: #64748b; }
    .btn-action.edit { background: #eff6ff; color: #2563eb; }
    .btn-action.delete { background: #fef2f2; color: #ef4444; }
    .btn-action:hover { transform: scale(1.1); }
    
    .empty-state i { opacity: 0.5; }
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
