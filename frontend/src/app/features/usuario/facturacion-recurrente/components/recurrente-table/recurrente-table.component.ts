import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturaProgramada } from '../../../../../domain/models/facturacion-programada.model';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';
import { FACTURACION_PROGRAMADA_PERMISSIONS } from '../../../../../constants/permission-codes';

@Component({
  selector: 'app-recurrente-table',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <div class="table-card animate__animated animate__fadeIn">
      <div class="table-responsive">
        <table class="table custom-table mb-0">
          <thead>
            <tr>
              <th>Cliente</th>
              <th class="text-center">Monto</th>
              <th class="text-center">Frecuencia</th>
              <th class="text-center">Próxima Emisión</th>
              <th class="text-center">Estadísticas</th>
              <th class="text-center">Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let prog of programaciones" class="align-middle">
              <td>
                <div class="d-flex align-items-center">
                  <div class="client-avatar me-3">
                    {{ (prog.cliente_nombre || 'C')[0] | uppercase }}
                  </div>
                  <div>
                    <div class="fw-bold text-dark">{{ prog.cliente_nombre }}</div>
                    <div class="text-muted small">{{ prog.concepto | slice:0:30 }}{{ prog.concepto.length > 30 ? '...' : '' }}</div>
                  </div>
                </div>
              </td>
              <td class="text-center font-monospace fw-bold text-primary">
                {{ prog.monto | currency:'USD' }}
              </td>
              <td class="text-center">
                <span class="badge-frecuencia" [ngClass]="prog.tipo_frecuencia.toLowerCase()">
                  {{ prog.tipo_frecuencia }}
                </span>
              </td>
              <td class="text-center">
                <div class="fw-500">{{ (prog.proxima_emision | date:'dd/MM/yyyy') || 'Pendiente' }}</div>
                <div class="text-muted smallest">Día: {{ prog.dia_emision || 'N/A' }}</div>
              </td>
              <td class="text-center">
                <div class="stats-mini-container">
                    <span class="text-success" title="Exitosas"><i class="bi bi-check-circle pe-1"></i>{{ prog.emisiones_exitosas }}</span>
                    <span class="mx-2 text-muted">/</span>
                    <span class="text-danger" title="Fallidas"><i class="bi bi-x-circle pe-1"></i>{{ prog.emisiones_fallidas }}</span>
                </div>
                <div class="text-muted smallest">Total: {{ prog.total_emisiones }}</div>
              </td>
              <td class="text-center">
                <span class="status-badge" [class.active]="prog.activo" [class.inactive]="!prog.activo">
                  {{ prog.activo ? 'ACTIVA' : 'INACTIVA' }}
                </span>
              </td>
              <td class="text-end">
                <div class="btn-group dropdown-minimal">
                  <button *hasPermission="['FACTURA_PROGRAMADA_VER', 'FACTURA_PROGRAMADA_VER_PROPIAS']" class="btn btn-icon-premium" (click)="onAction.emit({type: 'history', data: prog})" title="Ver Historial">
                    <i class="bi bi-clock-history"></i>
                  </button>
                  
                  <button *hasPermission="['FACTURA_PROGRAMADA_VER', 'FACTURA_PROGRAMADA_VER_PROPIAS']" class="btn btn-icon-premium" (click)="onAction.emit({type: 'view', data: prog})" title="Ver Detalles">
                    <i class="bi bi-eye"></i>
                  </button>

                  <button *hasPermission="'FACTURA_PROGRAMADA_EDITAR'" class="btn btn-icon-premium" (click)="onAction.emit({type: 'edit', data: prog})" title="Editar">
                    <i class="bi bi-pencil-square"></i>
                  </button>

                  <button
                    *hasPermission="'FACTURA_PROGRAMADA_EDITAR'"
                    class="btn btn-icon-premium"
                    [class.text-warning]="prog.activo"
                    [class.text-success]="!prog.activo"
                    (click)="onAction.emit({type: 'toggle', data: prog})"
                    [title]="prog.activo ? 'Pausar programación' : 'Reanudar programación'">
                    <i [class]="prog.activo ? 'bi bi-pause-circle' : 'bi bi-play-circle'"></i>
                  </button>

                  <ng-container *ngIf="prog.total_emisiones === 0">
                    <button
                      *hasPermission="'FACTURA_PROGRAMADA_ELIMINAR'"
                      class="btn btn-icon-premium text-danger"
                      (click)="onAction.emit({type: 'delete', data: prog})"
                      title="Eliminar">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </ng-container>
                </div>
              </td>
            </tr>
            <tr *ngIf="programaciones.length === 0">
              <td colspan="7" class="text-center py-5">
                <div class="empty-state">
                  <i class="bi bi-calendar-x text-muted mb-3" style="font-size: 3rem;"></i>
                  <h5 class="text-muted">No hay facturaciones programadas</h5>
                  <p class="text-muted small">Crea una nueva regla para comenzar la automatización.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
      border: 1px solid #f1f5f9;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    .custom-table thead th {
      background: #f8fafc;
      padding: 1.25rem 1.5rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 800;
      color: #64748b;
      border-bottom: 1px solid #f1f5f9;
    }
    .custom-table tbody td {
      padding: 1.15rem 1.5rem;
      border-bottom: 1px solid #f8fafc;
      font-size: 0.9rem;
    }
    .client-avatar {
      width: 40px;
      height: 40px;
      background: #f1f5f9;
      color: #7c3aed;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.1rem;
      border: 1px solid #e2e8f0;
    }
    .badge-frecuencia {
      padding: 0.35rem 0.8rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .badge-frecuencia.mensual { background: #e0e7ff; color: #4338ca; }
    .badge-frecuencia.trimestral { background: #fef3c7; color: #b45309; }
    .badge-frecuencia.anual { background: #dcfce7; color: #15803d; }

    .status-badge {
      display: inline-block;
      padding: 0.4rem 0.9rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 800;
    }
    .status-badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .status-badge.inactive { background: #f1f5f9; color: #94a3b8; }

    .btn-icon-premium {
      width: 34px;
      height: 34px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #64748b;
      margin: 0 2px;
      transition: all 0.2s;
    }
    .btn-icon-premium:hover {
      background: white;
      color: #1e293b;
      border-color: #cbd5e1;
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .smallest { font-size: 0.7rem; }
    .stats-mini-container {
        font-weight: 700;
        font-size: 0.85rem;
    }
  `]
})
export class RecurrenteTableComponent {
  @Input() programaciones: FacturaProgramada[] = [];
  @Output() onAction = new EventEmitter<{type: string, data: FacturaProgramada}>();
}
