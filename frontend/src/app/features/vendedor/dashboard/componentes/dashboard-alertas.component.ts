import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlertaVendedor } from '../services/vendedor-home.service';
import { InfoTooltipComponent } from '../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-dashboard-alertas',
  standalone: true,
  imports: [CommonModule, RouterModule, InfoTooltipComponent],
  template: `
    <div class="panel">
      <div class="panel-header">
        <span>
          <i class="bi bi-exclamation-triangle me-2"></i>
          Tablero de Urgencias
          <app-info-tooltip 
            message="Muestra renovaciones próximas (<48h) y comisiones recién generadas para atención inmediata.">
          </app-info-tooltip>
        </span>
        <span class="badge bg-danger rounded-pill" *ngIf="alertasRenovacion.length">
          {{ alertasRenovacion.length }}
        </span>
      </div>

      <!-- Loading -->
      <div class="text-center py-5" *ngIf="isLoading">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted small mt-2">Cargando alertas...</p>
      </div>

      <!-- Lista de alertas -->
      <div class="alerts-list" *ngIf="!isLoading && alertas.length">
        <div class="alert-row"
             *ngFor="let alerta of alertas"
             [ngClass]="{
               'border-danger-left': alerta.tipo === 'RENOVACION_PROXIMA',
               'border-success-left': alerta.tipo === 'COMISION_APROBADA'
             }">
          <div class="alert-icon-box">
            <i *ngIf="alerta.tipo === 'RENOVACION_PROXIMA'"
               class="bi bi-exclamation-triangle-fill"
               style="color:#ef4444"></i>
            <i *ngIf="alerta.tipo === 'COMISION_APROBADA'"
               class="bi bi-check-circle-fill"
               style="color:#10b981"></i>
          </div>
          <div class="alert-body">
            <div class="d-flex align-items-center gap-2">
              <span class="alert-title">{{ alerta.titulo }}</span>
              <span *ngIf="alerta.estado"
                    [ngClass]="'badge badge-' + getEstadoBadgeClass(alerta.estado)">
                {{ getEstadoTexto(alerta.estado) }}
              </span>
            </div>
            <span class="alert-desc">{{ alerta.descripcion }}</span>
            <span class="alert-date"><i class="bi bi-clock me-1"></i>{{ alerta.fecha }}</span>
          </div>
          <a *ngIf="alerta.accion_url"
             [routerLink]="alerta.accion_url"
             class="btn-atender">
            Atender
          </a>
        </div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!isLoading && !alertas.length">
        <i class="bi bi-shield-check" style="font-size:2.5rem; color:#10b981"></i>
        <h5>Todo bajo control</h5>
        <p>No tienes tareas urgentes pendientes.</p>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
    }
    .panel-header {
      padding: 0.9rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 800;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 14px 14px 0 0;
    }
    .alerts-list { display: flex; flex-direction: column; }
    .alert-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f8fafc;
    }
    .alert-row:last-child { border-bottom: none; }
    .border-danger-left { border-left: 3px solid #ef4444; }
    .border-success-left { border-left: 3px solid #10b981; }
    .alert-icon-box { font-size: 1.25rem; flex-shrink: 0; width: 24px; text-align: center; }
    .alert-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .alert-title { font-size: 0.875rem; font-weight: 700; color: #1e293b; }
    .alert-desc { font-size: 0.8rem; color: #64748b; }
    .alert-date { font-size: 0.75rem; color: #94a3b8; }
    .btn-atender {
      font-size: 0.75rem;
      font-weight: 700;
      color: #6366f1;
      text-decoration: none;
      border: 1px solid #e0e7ff;
      padding: 4px 12px;
      border-radius: 8px;
      white-space: nowrap;
    }
    .btn-atender:hover { background: #eef2ff; }
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }
    .empty-state h5 { margin-top: 1rem; font-weight: 700; color: #334155; }
    .empty-state p { color: #64748b; font-size: 0.875rem; margin: 0; }
    .badge {
      font-size: 0.65rem;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .d-flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
  `]
})
export class DashboardAlertasComponent {
  @Input() alertas: AlertaVendedor[] = [];
  @Input() isLoading = false;

  get alertasRenovacion() {
    return this.alertas?.filter(a => a.tipo === 'RENOVACION_PROXIMA') || [];
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'PENDIENTE': 'Pendiente',
      'APROBADA': 'Aprobada',
      'PAGADA': 'Pagada',
      'RECHAZADA': 'Rechazada'
    };
    return textos[estado] || estado;
  }

  getEstadoBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'PENDIENTE': 'warning',
      'APROBADA': 'info',
      'PAGADA': 'success',
      'RECHAZADA': 'danger'
    };
    return clases[estado] || 'secondary';
  }
}
