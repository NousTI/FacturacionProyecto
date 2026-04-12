import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../../domain/models/proveedor.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { GET_IDENTIFICACION_LABEL } from '../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-proveedores-table',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <div class="table-premium-container">
      <div class="table-responsive">
        <table class="table-premium">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Identificación</th>
              <th>Estado</th>
              <th>Contacto / Ubicación</th>
              <th>Crédito</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of proveedores" class="table-row">
              <!-- PROVEEDOR -->
              <td>
                <div class="client-info">
                  <div class="avatar" [style.background]="getAvatarColor(p.razon_social, 0.1)" [style.color]="getAvatarColor(p.razon_social, 1)">
                    {{ getInitials(p.razon_social) }}
                  </div>
                  <div class="details">
                    <span class="name">{{ p.razon_social }}</span>
                    <span class="sub">{{ p.nombre_comercial || 'Sin nombre comercial' }}</span>
                  </div>
                </div>
              </td>

              <!-- IDENTIFICACIÓN -->
              <td>
                <div class="id-info">
                  <span class="id-value">{{ p.identificacion }}</span>
                  <span class="id-type">{{ getTipoIdLabel(p.tipo_identificacion) }}</span>
                </div>
              </td>

              <!-- ESTADO -->
              <td>
                <span class="status-badge" [ngClass]="p.activo ? 'active' : 'inactive'">
                  <i class="bi" [ngClass]="p.activo ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  {{ p.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>

              <!-- CONTACTO -->
              <td>
                <div class="contact-info">
                  <div class="contact-item">
                    <i class="bi bi-envelope"></i>
                    <span>{{ p.email || '—' }}</span>
                  </div>
                  <div class="contact-item">
                    <i class="bi bi-geo-alt"></i>
                    <span>{{ p.ciudad }}, {{ p.provincia }}</span>
                  </div>
                </div>
              </td>

              <!-- CRÉDITO -->
              <td>
                <div class="credit-info">
                  <span class="amount">{{ p.dias_credito }} días</span>
                  <span class="days">Plazo de pago</span>
                </div>
              </td>

              <!-- ACCIONES -->
              <td class="text-center">
                <div class="dropdown">
                  <button class="btn-actions" 
                          type="button" 
                          data-bs-toggle="dropdown" 
                          aria-expanded="false"
                          data-bs-popper-config='{"strategy":"fixed"}'>
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                      <a class="dropdown-item" (click)="onAction.emit({type: 'view', proveedor: p})">
                        <i class="bi bi-eye text-primary"></i> Ver Detalles
                      </a>
                    </li>
                    <li *hasPermission="'PROVEEDOR_EDITAR'">
                      <a class="dropdown-item" (click)="onAction.emit({type: 'edit', proveedor: p})">
                        <i class="bi bi-pencil text-success"></i> Editar Proveedor
                      </a>
                    </li>
                    <li *hasPermission="'PROVEEDOR_ELIMINAR'">
                      <a class="dropdown-item" (click)="onAction.emit({type: 'toggle', proveedor: p})">
                        <i class="bi" [ngClass]="p.activo ? 'bi-toggle-off text-muted' : 'bi-toggle-on text-primary'"></i>
                        {{ p.activo ? 'Desactivar' : 'Activar' }}
                      </a>
                    </li>
                    <li *hasPermission="'PROVEEDOR_ELIMINAR'">
                      <hr class="dropdown-divider">
                    </li>
                    <li *hasPermission="'PROVEEDOR_ELIMINAR'">
                      <a class="dropdown-item text-danger" (click)="onAction.emit({type: 'delete', proveedor: p})">
                        <i class="bi bi-trash"></i> Eliminar
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- EMPTY STATE -->
        <div *ngIf="proveedores.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="bi bi-shop"></i>
          </div>
          <h3>No se encontraron proveedores</h3>
          <p>No hay registros que coincidan con los criterios de búsqueda o filtros aplicados.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-premium-container { background: white; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; }
    .table-premium { width: 100%; border-collapse: separate; border-spacing: 0; }
    .table-premium thead th { background: #f8fafc; padding: 1.25rem 1.5rem; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; }
    .table-row { transition: all 0.2s; }
    .table-row:hover { background: #f8fafc; }
    .table-row td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .table-row:last-child td { border-bottom: none; }
    .client-info { display: flex; align-items: center; gap: 1rem; }
    .avatar { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }
    .details { display: flex; flex-direction: column; }
    .name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .sub { font-size: 0.75rem; color: #94a3b8; }
    .id-info { display: flex; flex-direction: column; }
    .id-value { font-weight: 700; color: #475569; font-size: 0.9rem; }
    .id-type { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
    .status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.75rem; font-weight: 701; }
    .status-badge.active { background: #15803d; color: white; }
    .status-badge.inactive { background: #dc2626; color: white; }
    .contact-info { display: flex; flex-direction: column; gap: 0.3rem; }
    .contact-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #64748b; }
    .contact-item i { font-size: 0.9rem; color: #94a3b8; }
    .credit-info { display: flex; flex-direction: column; }
    .amount { font-weight: 800; color: #1e293b; font-size: 0.9rem; }
    .days { font-size: 0.75rem; color: #64748b; }
    .btn-actions { 
      width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent; color: #94a3b8; 
      display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin: 0 auto;
    }
    .btn-actions:hover { background: #f1f5f9; color: #1e293b; }
    .dropdown-menu { border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); padding: 0.5rem; }
    .dropdown-item { border-radius: 8px; padding: 0.6rem 1rem; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.75rem; color: #475569; cursor: pointer; }
    .dropdown-item i { font-size: 1rem; }
    .dropdown-item:hover { background: #f8fafc; }
    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 64px; height: 64px; background: #f8fafc; color: #cbd5e1; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem; }
    .empty-state h3 { font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .empty-state p { color: #64748b; max-width: 400px; margin: 0 auto; }
  `]
})
export class ProveedoresTableComponent {
  @Input() proveedores: Proveedor[] = [];
  @Output() onAction = new EventEmitter<{ type: string, proveedor: Proveedor }>();

  getTipoIdLabel(code: string): string {
    return GET_IDENTIFICACION_LABEL(code);
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getAvatarColor(name: string, opacity: number): string {
    if (!name) return `rgba(148, 163, 184, ${opacity})`;
    const colors = [
      `rgba(99, 102, 241, ${opacity})`, `rgba(16, 185, 129, ${opacity})`,
      `rgba(245, 158, 11, ${opacity})`, `rgba(239, 68, 68, ${opacity})`,
      `rgba(139, 92, 246, ${opacity})`, `rgba(20, 184, 166, ${opacity})`
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  }
}
