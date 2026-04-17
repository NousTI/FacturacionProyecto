import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InfoTooltipComponent } from '../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-dashboard-acciones',
  standalone: true,
  imports: [CommonModule, RouterModule, InfoTooltipComponent],
  template: `
    <div class="panel h-100">
      <div class="panel-header">
        <span class="d-flex align-items-center gap-1">
          <i class="bi bi-lightning-charge me-2"></i>Acciones Rápidas
          <app-info-tooltip message="Accesos directos a las funciones más frecuentes: registrar empresa, gestionar suscripciones, comisiones y reportes."></app-info-tooltip>
        </span>
      </div>
      <div class="quick-links">
        <a routerLink="/vendedor/empresas" class="quick-link">
          <div class="ql-icon status-info-soft">
            <i class="bi bi-building-add"></i>
          </div>
          <span>Registrar Empresa</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
        <a routerLink="/vendedor/suscripciones" class="quick-link">
          <div class="ql-icon status-warning-soft">
            <i class="bi bi-credit-card"></i>
          </div>
          <span>Suscripciones</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
        <a routerLink="/vendedor/comisiones" class="quick-link">
          <div class="ql-icon status-success-soft">
            <i class="bi bi-percent"></i>
          </div>
          <span>Mis Comisiones</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
        <a routerLink="/vendedor/clientes" class="quick-link">
          <div class="ql-icon status-info-soft" style="filter: hue-rotate(180deg);">
            <i class="bi bi-people"></i>
          </div>
          <span>Clientes</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
        <a routerLink="/vendedor/reportes" class="quick-link">
          <div class="ql-icon status-danger-soft" style="filter: hue-rotate(300deg);">
            <i class="bi bi-file-earmark-bar-graph"></i>
          </div>
          <span>Reportes</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
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
    .quick-links { display: flex; flex-direction: column; }
    .quick-link {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.85rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-main);
      text-decoration: none;
      border-bottom: 1px solid var(--border-color);
      transition: all 0.2s;
    }
    .quick-link:hover { background: var(--status-info-bg); color: var(--status-info-text); }
    .quick-link:last-child { border-bottom: none; }
    
    .ql-icon {
      width: 34px; height: 34px;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }
    
    .status-info-soft { background: var(--status-info-bg); color: var(--status-info); }
    .status-warning-soft { background: var(--status-warning-bg); color: var(--status-warning); }
    .status-success-soft { background: var(--status-success-bg); color: var(--status-success); }
    .status-danger-soft { background: var(--status-danger-bg); color: var(--status-danger); }
    
    .text-muted { color: var(--text-muted) !important; }
  `]
})
export class DashboardAccionesComponent {}
