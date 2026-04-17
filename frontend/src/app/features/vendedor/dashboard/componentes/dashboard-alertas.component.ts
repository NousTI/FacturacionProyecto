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
        <span class="badge status-danger-bg status-danger-text rounded-pill" *ngIf="alertasRenovacion.length">
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
               class="bi bi-exclamation-triangle-fill text-danger"></i>
            <i *ngIf="alerta.tipo === 'COMISION_APROBADA'"
               class="bi bi-check-circle-fill text-success"></i>
          </div>
          <div class="alert-body">
            <div class="d-flex align-items-center gap-2">
              <span class="alert-title">{{ alerta.titulo }}</span>
              <span *ngIf="alerta.estado"
                    class="badge-status-premium"
                    [ngClass]="'badge-' + getEstadoBadgeClass(alerta.estado)">
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
        <i class="bi bi-shield-check" style="font-size:2.5rem; color: var(--status-success)"></i>
        <h5>Todo bajo control</h5>
        <p>No tienes tareas urgentes pendientes.</p>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      display: flex;
      flex-direction: column;
    }
    .panel-header {
      padding: 0.9rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-main);
      border-bottom: 1px solid var(--border-color);
      background: var(--status-neutral-bg);
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
      border-bottom: 1px solid var(--border-color);
    }
    .alert-row:last-child { border-bottom: none; }
    .border-danger-left { border-left: 3px solid var(--status-danger); }
    .border-success-left { border-left: 3px solid var(--status-success); }
    .alert-icon-box { font-size: 1.25rem; flex-shrink: 0; width: 24px; text-align: center; }
    .alert-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .alert-title { font-size: 0.875rem; font-weight: 700; color: var(--text-main); }
    .alert-desc { font-size: 0.8rem; color: var(--text-muted); }
    .alert-date { font-size: 0.75rem; color: var(--text-muted); opacity: 0.8; }
    
    .btn-atender {
      font-size: 0.75rem; font-weight: 700;
      color: var(--status-info-text); text-decoration: none;
      background: var(--status-info-bg); border: 1px solid var(--status-info);
      padding: 6px 14px; border-radius: 8px; white-space: nowrap;
      transition: all 0.2s;
    }
    .btn-atender:hover { background: var(--status-info); color: white; transform: translateY(-1px); }

    .empty-state { text-align: center; padding: 3rem 1rem; }
    .empty-state h5 { margin-top: 1rem; font-weight: 700; color: var(--text-main); }
    .empty-state p { color: var(--text-muted); font-size: 0.875rem; margin: 0; }
    
    .badge-status-premium {
      font-size: 0.65rem; padding: 4px 10px; border-radius: 6px;
      font-weight: 800; white-space: nowrap; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-warning { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .badge-info { background: var(--status-info-bg); color: var(--status-info-text); }
    .badge-success { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-danger { background: var(--status-danger-bg); color: var(--status-danger-text); }
    
    .status-danger-bg { background: var(--status-danger-bg); }
    .status-danger-text { color: var(--status-danger-text); }
    
    .text-danger { color: var(--status-danger) !important; }
    .text-success { color: var(--status-success) !important; }
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
