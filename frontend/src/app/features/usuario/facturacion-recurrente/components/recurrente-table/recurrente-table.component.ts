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
                <div class="dropdown dropdown-premium">
                  <button class="btn btn-icon-premium dropdown-trigger shadow-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-premium border-0 animate__animated animate__fadeIn animate__faster">
                    <li>
                      <h6 class="dropdown-header">Gestión de Regla</h6>
                    </li>
                    <li *hasPermission="['FACTURA_PROGRAMADA_VER', 'FACTURA_PROGRAMADA_VER_PROPIAS']">
                      <button class="dropdown-item" (click)="onAction.emit({type: 'view', data: prog})">
                        <i class="bi bi-eye me-2 text-primary"></i>Ver Plantilla
                      </button>
                    </li>
                    <li *hasPermission="['FACTURA_PROGRAMADA_VER', 'FACTURA_PROGRAMADA_VER_PROPIAS']">
                      <button class="dropdown-item" (click)="onAction.emit({type: 'history', data: prog})">
                        <i class="bi bi-clock-history me-2 text-info"></i>Ver Historial
                      </button>
                    </li>
                    
                    <ng-container *ngIf="canExecuteManual(prog)">
                      <li><hr class="dropdown-divider"></li>
                      <li *hasPermission="['FACTURA_PROGRAMADA_CREAR', 'FACTURA_PROGRAMADA_EDITAR']">
                        <button class="dropdown-item fw-bold text-primary" (click)="onAction.emit({type: 'execute', data: prog})">
                          <i class="bi bi-lightning-fill me-2 anim-pulse"></i>Ejecutar Ahora
                        </button>
                      </li>
                    </ng-container>

                    <li><hr class="dropdown-divider"></li>
                    <li *hasPermission="'FACTURA_PROGRAMADA_EDITAR'">
                      <button class="dropdown-item" (click)="onAction.emit({type: 'edit', data: prog})">
                        <i class="bi bi-pencil-square me-2 text-secondary"></i>Editar Factura Base
                      </button>
                    </li>
                    <li *hasPermission="'FACTURA_PROGRAMADA_EDITAR'">
                      <button 
                        class="dropdown-item" 
                        [class.text-warning]="prog.activo"
                        [class.text-success]="!prog.activo"
                        (click)="onAction.emit({type: 'toggle', data: prog})">
                        <i [class]="prog.activo ? 'bi bi-pause-circle' : 'bi bi-play-circle'" class="me-2"></i>
                        {{ prog.activo ? 'Pausar Automatización' : 'Activar Automatización' }}
                      </button>
                    </li>
                    
                    <ng-container *ngIf="prog.total_emisiones === 0">
                      <li><hr class="dropdown-divider"></li>
                      <li *hasPermission="'FACTURA_PROGRAMADA_ELIMINAR'">
                        <button class="dropdown-item text-danger" (click)="onAction.emit({type: 'delete', data: prog})">
                          <i class="bi bi-trash3 me-2"></i>Eliminar Definitivamente
                        </button>
                      </li>
                    </ng-container>
                  </ul>
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
      margin-bottom: 2rem;
      position: relative;
      z-index: 1;
    }
    .table-responsive {
      overflow: visible !important;
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

    /* PREMIUM DROPDOWN STYLES */
    .dropdown-premium .dropdown-trigger {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #64748b;
      transition: all 0.2s;
    }
    .dropdown-premium .dropdown-trigger:hover {
      background: white;
      color: #1e293b;
      border-color: #cbd5e1;
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .dropdown-premium .dropdown-menu {
      min-width: 240px;
      padding: 0.75rem;
      border-radius: 18px;
      box-shadow: 0 15px 50px -12px rgba(22, 29, 53, 0.2) !important;
      border: 1px solid rgba(226, 232, 240, 0.8);
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.95);
      z-index: 9999;
    }
    .dropdown-premium .dropdown-item {
      padding: 0.7rem 1rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      transition: all 0.2s;
      margin-bottom: 2px;
    }
    .dropdown-premium .dropdown-item:hover {
      background: #f1f5f9;
      color: #0f172a;
      transform: translateX(4px);
    }
    .dropdown-premium .dropdown-header {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      font-weight: 800;
      color: #94a3b8;
      padding: 0.5rem 1rem;
    }
    .dropdown-premium .dropdown-divider {
      border-top: 1px solid #f1f5f9;
      margin: 0.5rem 0.5rem;
    }
    .anim-pulse {
      animation: lightning-pulse 1.5s infinite;
    }
    @keyframes lightning-pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }
  `]
})
export class RecurrenteTableComponent {
  @Input() programaciones: FacturaProgramada[] = [];
  @Output() onAction = new EventEmitter<{type: string, data: FacturaProgramada}>();

  get hasPermissionEditar(): boolean {
    return true; // Simplificado ya que el componente padre controla la visibilidad técnica, pero usaremos el directive si es posible o una prop
  }

  canExecuteManual(prog: FacturaProgramada): boolean {
    if (!prog.activo) return false;
    if (!prog.proxima_emision) return true;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Proxima emision viene como string YYYY-MM-DD
      const [year, month, day] = prog.proxima_emision.split('-').map(Number);
      const nextDate = new Date(year, month - 1, day);
      
      return nextDate <= today && !prog.emitida_hoy;
    } catch (e) {
      return true; // Fallback seguro
    }
  }
}
