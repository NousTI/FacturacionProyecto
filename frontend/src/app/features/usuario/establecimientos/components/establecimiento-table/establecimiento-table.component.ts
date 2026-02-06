import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Establecimiento } from '../../../../../domain/models/establecimiento.model';

@Component({
  selector: 'app-establecimiento-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <section class="module-table">
      <div class="table-container border-0 shadow-premium">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Establecimiento</th>
                <th style="width: 120px">Código SRI</th>
                <th>Dirección</th>
                <th style="width: 110px">Estado</th>
                <th style="width: 120px">🔑 Puntos PE</th>
                <th style="width: 140px">Último Secuencial</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let est of establecimientos" class="table-row">
                <!-- Nombre -->
                <td>
                  <div class="d-flex align-items-center">
                    <div 
                      class="avatar-soft-premium me-3" 
                      [style.background]="getAvatarColor(est.nombre, 0.1)"
                      [style.color]="getAvatarColor(est.nombre, 1)"
                    >
                      {{ getInitials(est.nombre) }}
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block mb-0">{{ est.nombre }}</span>
                      <small class="text-muted" style="font-size: 0.75rem;">{{ est.empresa_id | slice:0:8 }}</small>
                    </div>
                  </div>
                </td>

                <!-- Código SRI -->
                <td>
                  <span class="badge-code">{{ est.codigo }}</span>
                </td>

                <!-- Dirección -->
                <td>
                  <span class="text-dark" style="font-size: 0.85rem;">{{ est.direccion }}</span>
                </td>

                <!-- Estado -->
                <td>
                  <span class="badge-status-premium" [ngClass]="est.activo ? 'activo' : 'inactivo'">
                    {{ est.activo ? '🟢 ACTIVO' : '⚫ INACTIVO' }}
                  </span>
                </td>

                <!-- Puntos de Emisión -->
                <td>
                  <span class="puntos-badge">{{ est.puntos_emision_total || 0 }}</span>
                </td>

                <!-- Último Secuencial -->
                <td>
                  <span class="secuencial-badge">{{ ('00' + (est.ultimo_secuencial || 0)).slice(-3) }}</span>
                </td>

                <!-- Acciones -->
                <td class="text-end">
                  <div class="dropdown">
                    <button
                      class="btn-action-trigger"
                      type="button"
                      [id]="'actions-' + est.id"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul 
                      class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4" 
                      [attr.aria-labelledby]="'actions-' + est.id"
                    >
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view', establecimiento: est})">
                          <i class="bi bi-eye"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'edit', establecimiento: est})">
                          <i class="bi bi-pencil-square"></i>
                          <span class="ms-2">Editar</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2 text-danger" href="javascript:void(0)" (click)="onAction.emit({type: 'delete', establecimiento: est})">
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

          <!-- Empty State -->
          <div *ngIf="establecimientos.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>No se encontraron establecimientos</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .module-table {
      background: white;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(22, 29, 53, 0.05), 0 4px 6px -4px rgba(22, 29, 53, 0.05);
      border: 1px solid #f1f5f9;
      overflow: visible !important;
    }

    .table-responsive-premium {
      overflow: visible !important;
      position: relative;
    }

    .table {
      border-collapse: collapse;
    }

    .table thead {
      background: #f8fafc;
      border-bottom: 2px solid #f1f5f9;
    }

    .table th {
      font-weight: 700;
      color: #64748b;
      font-size: 0.8rem;
      padding: 1rem 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .table td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .table tbody tr:hover {
      background: #f8fafc;
      transition: background-color 0.2s;
    }

    .avatar-soft-premium {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .badge-code {
      background: #f0f9ff;
      color: #0369a1;
      padding: 0.35rem 0.85rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      font-family: 'Courier New', monospace;
      display: inline-block;
    }

    .badge-status-premium {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .badge-status-premium.activo {
      background: #ecfdf5;
      color: #10b981;
    }

    .badge-status-premium.inactivo {
      background: #fef2f2;
      color: #ef4444;
    }

    .puntos-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #fef3c7;
      color: #92400e;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .dropdown {
      position: relative;
    }

    .btn-action-trigger {
      background: #f8fafc;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-action-trigger:hover,
    .btn-action-trigger[aria-expanded="true"] {
      background: #161d35;
      color: #ffffff;
    }

    .dropdown-menu {
      border-radius: 16px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.2) !important;
      z-index: 1000 !important;
      padding: 0.75rem !important;
    }

    .dropdown-item {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      border-radius: 10px !important;
      margin: 0.25rem;
    }

    .dropdown-item:hover {
      background: #f8fafc;
      color: #161d35;
    }

    .dropdown-item i {
      font-size: 1.1rem;
      width: 18px;
      text-align: center;
    }

    .dropdown-item.text-danger:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: #94a3b8;
    }

    .empty-state i {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    @media (max-width: 1024px) {
      .table-responsive-premium {
        overflow-x: auto;
      }

      .table th,
      .table td {
        padding: 0.75rem;
        font-size: 0.85rem;
      }
    }

    @media (max-width: 768px) {
      .table th,
      .table td {
        padding: 0.65rem;
      }

      .avatar-soft-premium {
        width: 32px;
        height: 32px;
        font-size: 0.8rem;
      }

      .badge-status-premium {
        font-size: 0.7rem;
        padding: 0.25rem 0.65rem;
      }
    }
  `]
})
export class EstablecimientoTableComponent {
  @Input() establecimientos: Establecimiento[] = [];
  @Output() onAction = new EventEmitter<{
    type: 'view' | 'edit' | 'delete';
    establecimiento: Establecimiento;
  }>();

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  getAvatarColor(text: string, opacity: number): string {
    const colors = [
      'rgba(59, 130, 246, ' + opacity + ')',    // Blue
      'rgba(16, 185, 129, ' + opacity + ')',    // Green
      'rgba(245, 158, 11, ' + opacity + ')',    // Amber
      'rgba(139, 92, 246, ' + opacity + ')',    // Purple
      'rgba(239, 68, 68, ' + opacity + ')',     // Red
      'rgba(6, 182, 212, ' + opacity + ')',     // Cyan
    ];
    const index = text.charCodeAt(0) % colors.length;
    return colors[index];
  }
}
