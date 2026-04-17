import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vendedor-empresa-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 250px">Empresa</th>
                <th style="width: 130px; text-align: center;">Estado</th>
                <th style="width: 180px">Plan Actual</th>
                <th style="width: 160px">Uso de Recursos</th>
                <th style="width: 140px">Inicio</th>
                <th style="width: 140px">Vencimiento</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let empresa of empresas">
                <td>
                  <div class="d-flex align-items-center" style="max-width: 230px;">
                    <div class="avatar-soft-premium me-3">
                      {{ getInitials(empresa.razonSocial) }}
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate" [title]="empresa.razonSocial">{{ empresa.razonSocial }}</span>
                      <small class="text-muted font-mono" style="font-size: 0.73rem;">{{ empresa.ruc }}</small>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="empresa.estado?.toLowerCase() || 'inactivo'">
                    {{ empresa.estado || 'INACTIVO' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="text-corporate fw-700" style="font-size: 0.85rem;">{{ empresa.plan || 'Sin Plan' }}</span>
                  </div>
                </td>
                <td>
                   <div class="usage-container">
                      <div class="d-flex justify-content-between mb-1" style="font-size: 0.65rem;">
                         <span class="text-muted">Usuarios</span>
                         <span class="fw-bold text-dark">{{ empresa.usage?.usuarios || 0 }}/{{ empresa.limits?.max_usuarios || '-' }}</span>
                      </div>
                      <div class="progress-premium">
                         <div class="progress-bar-premium" [style.width]="getUsagePercent(empresa.usage?.usuarios, empresa.limits?.max_usuarios) + '%'"></div>
                      </div>
                   </div>
                </td>
                <td>
                   <div class="d-flex flex-column">
                    <span class="text-muted fw-600" style="font-size: 0.85rem;">
                      {{ empresa.fechaInicio ? (empresa.fechaInicio | date:'dd/MM/yyyy') : '-' }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-bold" [class.text-danger]="isExpired(empresa.fechaVencimiento)" style="font-size: 0.85rem;">
                      {{ empresa.fechaVencimiento ? (empresa.fechaVencimiento | date:'dd/MM/yyyy') : '-' }}
                    </span>
                    <small class="text-muted" style="font-size: 0.7rem;" *ngIf="empresa.fechaVencimiento && !isExpired(empresa.fechaVencimiento)">
                       En {{ getDaysRemaining(empresa.fechaVencimiento) }} días
                    </small>
                  </div>
                </td>
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + empresa.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-bs-popper-config='{"strategy":"fixed"}'
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + empresa.id">
                      <!-- VIEW DETAILS -->
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view_details', empresa})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Expediente</span>
                        </a>
                      </li>
                      
                      <li><hr class="dropdown-divider mx-2"></li>

                      <!-- ACCESS COMPANY (Conditional) -->
                      <li *ngIf="canAccess">
                        <a class="dropdown-item rounded-3 py-2 text-corporate fw-bold" href="javascript:void(0)" (click)="onAction.emit({type: 'access_company', empresa})">
                          <i class="bi bi-box-arrow-in-right"></i>
                          <span class="ms-2">Acceder</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="empresas.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-3"></i>
            No se encontraron empresas asociadas.
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
    }
    .module-table { 
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin-top: 0; 
    }
    .table-container {
      background: var(--bg-main, #ffffff);
      border-radius: 20px;
      border: 1px solid var(--border-color, #f1f5f9);
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: auto;
      max-height: 100%;
      overflow: hidden;
      margin-bottom: 0;
    }
    .table-responsive-premium { 
      flex: 1;
      overflow-y: auto; 
      overflow-x: auto;
      position: relative; 
    }
    .table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
    }    .table thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bg-main);
      padding: 1rem 1.5rem;
      font-size: var(--text-base);
      color: var(--text-main);
      font-weight: 800;
      border-bottom: 2px solid var(--border-color);
      vertical-align: middle;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: var(--text-md);
      vertical-align: middle;
    }
    
    .avatar-soft-premium {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.95rem;
      background: var(--primary-color); color: #ffffff;
      flex-shrink: 0;
    }
    
    .badge-status-premium {
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      font-size: var(--text-xs);
      font-weight: 800;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .activo, .ACTIVO { background: var(--status-success-bg); color: var(--status-success-text); }
    .inactivo, .INACTIVO { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .vencida, .VENCIDA { background: var(--status-warning-bg); color: var(--status-warning-text); }

    .usage-container { width: 100%; max-width: 140px; }
    .progress-premium {
      height: 6px; background: var(--status-neutral-bg); border-radius: 10px; overflow: hidden;
    }
    .progress-bar-premium {
      height: 100%; background: var(--primary-color); border-radius: 10px; transition: width 0.3s ease;
    }
    
    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: var(--text-muted);
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: var(--status-info-bg); color: var(--status-info-text);
    }
    
    .dropdown-menu {
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 1050 !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--text-main); padding: 0.5rem 1rem;
      display: flex; align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover { background: var(--status-info-bg); color: var(--status-info-text); }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    
    .fw-600 { font-weight: 600; }
    .fw-700 { font-weight: 700; }
    .fw-800 { font-weight: 800; }
    .text-corporate { color: var(--primary-color) !important; }
    .font-mono { font-family: 'DM Mono', monospace; }

  `]
})
export class VendedorEmpresaTableComponent {
  @Input() empresas: any[] = [];
  @Input() canAccess: boolean = false;
  @Output() onAction = new EventEmitter<{ type: string, empresa: any }>();

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getUsagePercent(current: number = 0, max: any = 0): number {
    if (!max || max === '-') return 0;
    const percent = (current / max) * 100;
    return Math.min(percent, 100);
  }

  isExpired(date: any): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  getDaysRemaining(date: any): number {
    if (!date) return 0;
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
