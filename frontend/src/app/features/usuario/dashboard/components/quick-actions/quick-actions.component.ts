import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="panel">
      <div class="panel-header">
        <span><i class="bi bi-lightning-charge me-2"></i>Accesos Rápidos</span>
      </div>
      <div class="quick-links">
        <a routerLink="/usuario/facturacion" class="quick-link">
          <div class="ql-icon" style="color:#6366f1; background:rgba(99,102,241,.1)">
            <i class="bi bi-plus-circle-fill"></i>
          </div>
          <span>Nueva Factura</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
        <a routerLink="/usuario/clientes" class="quick-link">
          <div class="ql-icon" style="color:#0ea5e9; background:rgba(14,165,233,.1)">
            <i class="bi bi-person-plus-fill"></i>
          </div>
          <span>Nuevo Cliente</span>
          <i class="bi bi-chevron-right ms-auto text-muted"></i>
        </a>
        <a routerLink="/usuario/productos" class="quick-link">
          <div class="ql-icon" style="color:#ec4899; background:rgba(236,72,153,.1)">
            <i class="bi bi-box-seam-fill"></i>
          </div>
          <span>Productos</span>
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
      color: black;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    .quick-link:hover { background: #f8fafc; color: black; }
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
export class QuickActionsComponent {}


