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
          <div class="ql-icon" style="color:#6366f1; background:rgba(99,102,241,.1)">
            <i class="bi bi-building-add"></i>
          </div>
          <span>Registrar Empresa</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
        <a routerLink="/vendedor/pagos" class="quick-link">
          <div class="ql-icon" style="color:#f59e0b; background:rgba(245,158,11,.1)">
            <i class="bi bi-credit-card"></i>
          </div>
          <span>Suscripciones</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
        <a routerLink="/vendedor/comisiones" class="quick-link">
          <div class="ql-icon" style="color:#10b981; background:rgba(16,185,129,.1)">
            <i class="bi bi-percent"></i>
          </div>
          <span>Mis Comisiones</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
        <a routerLink="/vendedor/clientes" class="quick-link">
          <div class="ql-icon" style="color:#0ea5e9; background:rgba(14,165,233,.1)">
            <i class="bi bi-people"></i>
          </div>
          <span>Clientes</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
        <a routerLink="/vendedor/reportes" class="quick-link">
          <div class="ql-icon" style="color:#ec4899; background:rgba(236,72,153,.1)">
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
    .quick-links { display: flex; flex-direction: column; }
    .quick-link {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.85rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #334155;
      text-decoration: none;
      border-bottom: 1px solid #f8fafc;
      transition: background 0.15s;
    }
    .quick-link:hover { background: #f8fafc; color: #161d35; }
    .quick-link:last-child { border-bottom: none; }
    .ql-icon {
      width: 34px; height: 34px;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }
  `]
})
export class DashboardAccionesComponent {}
