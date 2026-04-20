import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-quick-links',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="editorial-panel h-100">
      <div class="panel-header-premium">
        <div class="d-flex align-items-center gap-2">
          <div class="icon-circle-sm" style="background: var(--status-warning-bg); color: var(--status-warning-text);">
            <i class="bi bi-lightning-charge"></i>
          </div>
          <div class="d-flex flex-column">
            <span class="panel-title">Accesos Rápidos</span>
            <span class="panel-subtitle">Atajos a tareas comunes</span>
          </div>
        </div>
      </div>

      <div class="quick-links-area">
        <a routerLink="/empresas" [queryParams]="{ new: 'true' }" class="nav-item-premium">
          <div class="icon-sq" style="color: var(--status-info-text); background: var(--status-info-bg)">
            <i class="bi bi-plus-circle"></i>
          </div>
          <span>Nueva Empresa</span>
          <i class="bi bi-chevron-right ms-auto arrow"></i>
        </a>
        <a routerLink="/vendedores" class="nav-item-premium">
          <div class="icon-sq" style="color: var(--primary-color); background: var(--border-color)">
            <i class="bi bi-person-badge"></i>
          </div>
          <span>Gestionar Vendedores</span>
          <i class="bi bi-chevron-right ms-auto arrow"></i>
        </a>
        <a routerLink="/reportes" class="nav-item-premium">
          <div class="icon-sq" style="color: var(--status-warning-text); background: var(--status-warning-bg)">
            <i class="bi bi-file-earmark-bar-graph"></i>
          </div>
          <span>Reportes Globales</span>
          <i class="bi bi-chevron-right ms-auto arrow"></i>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .editorial-panel {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header-premium {
      padding: 1.5rem 1.5rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .panel-title {
      font-size: 1rem;
      font-weight: 800;
      color: #000000;
      line-height: 1.2;
    }

    .panel-subtitle {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .icon-circle-sm {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }

    /* Quick Links Area */
    .quick-links-area { padding: 0 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 8px; }
    
    .nav-item-premium {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.75rem 1rem; border-radius: 14px;
      text-decoration: none; color: var(--text-muted); font-weight: 600; font-size: 0.875rem;
      transition: all 0.2s ease;
    }
    .nav-item-premium:hover { 
      background: var(--border-color); 
      color: var(--primary-color); 
    }
    .nav-item-premium:hover .arrow { transform: translateX(3px); color: var(--primary-color); }
    
    .icon-sq {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; flex-shrink: 0;
    }
    .arrow { font-size: 0.75rem; color: var(--text-muted); transition: all 0.2s; }
  `]
})
export class QuickLinksComponent {}
