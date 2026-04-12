import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GET_PERSONA_LABEL, GET_CONTRIBUYENTE_LABEL } from '../../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-empresa-table',
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 290px">Nombre</th>
                <th style="width: 120px">Estado</th>
                <th style="width: 160px">Plan Actual</th>
                <th style="width: 140px">Vendedor</th>
                <th style="width: 160px">Usuarios</th>
                <th style="width: 130px">Inicio</th>
                <th style="width: 130px">Vencimiento</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let empresa of empresas">
                <td>
                  <div class="d-flex align-items-center" style="max-width: 270px;">
                    <div class="avatar-soft-premium me-2">
                      {{ getInitials(empresa.razonSocial) }}
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate" [title]="empresa.razonSocial">{{ empresa.razonSocial }}</span>
                      <small class="text-muted font-mono" style="font-size: 0.65rem;">{{ empresa.ruc }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge-status-premium" [ngClass]="empresa.estado?.toLowerCase() || 'inactivo'">
                    {{ empresa.estado || 'INACTIVO' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="text-corporate fw-800" style="font-size: var(--text-base);" *ngIf="empresa.suscripcion_estado === 'ACTIVA' || empresa.suscripcion_estado === 'PRUEBA'">{{ empresa.plan || 'Sin Plan' }}</span>
                    <span class="text-danger fw-800" style="font-size: var(--text-base);" *ngIf="empresa.suscripcion_estado && empresa.suscripcion_estado !== 'ACTIVA' && empresa.suscripcion_estado !== 'PRUEBA'">{{ empresa.suscripcion_estado }}</span>
                    <span class="text-muted fw-800" style="font-size: var(--text-base);" *ngIf="!empresa.suscripcion_estado">Sin Suscripción</span>
                    
                    <small class="text-muted" style="font-size: var(--text-xs); font-weight: 700;">
                      {{ getPersonaLabel(empresa.tipo_persona) + ' | ' + getContribuyenteLabel(empresa.tipo_contribuyente) }}
                    </small>
                  </div>
                </td>
                <td>
                  <div class="d-flex align-items-center" *ngIf="empresa.vendedorName; else noVendedor">
                    <span class="text-dark fw-600" style="font-size: 0.8rem;">{{ empresa.vendedorName }}</span>
                  </div>
                  <ng-template #noVendedor>
                    <span class="badge bg-light text-muted border fw-normal" style="font-size: 0.7rem;">Directa</span>
                  </ng-template>
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
                    <span class="text-muted fw-bold" style="font-size: 0.85rem;">
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
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view_details', empresa})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'edit_admin', empresa})">
                          <i class="bi bi-pencil-square text-corporate"></i>
                          <span class="ms-2">Editar Datos</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'change_plan', empresa})">
                          <i class="bi bi-arrow-up-right-circle text-corporate"></i>
                          <span class="ms-2">Cambiar Plan</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'assign_vendedor', empresa})">
                          <i class="bi bi-person-badge text-corporate"></i>
                          <span class="ms-2">Asignar Vendedor</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'toggle_status', empresa})">
                          <i class="bi" [ngClass]="empresa.activo ? 'bi-toggle-off text-muted' : 'bi-toggle-on text-corporate'"></i>
                          <span class="ms-2">{{ empresa.activo ? 'Desactivar Empresa' : 'Activar Empresa' }}</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2 text-corporate fw-bold" href="javascript:void(0)" (click)="onAction.emit({type: 'support_access', empresa})">
                          <i class="bi bi-shield-lock"></i>
                          <span class="ms-2">Acceso de Soporte</span>
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
            No se encontraron empresas registradas.
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
    }
    .table thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bg-main, #ffffff);
      padding: 1rem 1.5rem;
      font-size: var(--text-base);
      text-transform: capitalize;
      letter-spacing: 0;
      color: #0f172a;
      font-weight: 600;
      border-bottom: 2px solid var(--border-color, #f1f5f9);
      vertical-align: middle;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-muted, #475569);
      font-size: var(--text-md);
    }
    
    .avatar-soft-premium {
      width: 38px; height: 38px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: var(--text-base);
      background: var(--primary-color, #161d35);
      color: #ffffff;
    }
    
    .badge-status-premium {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: var(--text-sm);
      font-weight: 600;
      display: inline-block;
      text-transform: capitalize;
    }
    .badge-status-premium.activo { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-premium.inactivo { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .badge-status-premium.vencida { background: var(--status-warning-bg); color: var(--status-warning-text); }


    
    .usage-container { width: 100%; max-width: 120px; }
    .progress-premium {
      height: 4px;
      background: #f1f5f9;
      border-radius: 10px;
      overflow: hidden;
    }
    .progress-bar-premium {
      height: 100%;
      background: #111827;
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    
    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #f8fafc; color: #0f172a;
    }
    
    .dropdown-menu {
      border: 1px solid var(--border-color, #e2e8f0) !important;
      box-shadow: none !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--text-muted, #475569); padding: 0.5rem 1rem;
      display: flex; align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover { background: #f8fafc; color: #0f172a; }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    
    .fw-800 { font-weight: 800; }
    .fw-600 { font-weight: 600; }
    .text-corporate { color: var(--primary-color, #111827) !important; }
    .font-mono { font-family: 'DM Mono', monospace; font-size: 0.8rem; color: #94a3b8; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class EmpresaTableComponent {
  @Input() empresas: any[] = [];
  @Output() onAction = new EventEmitter<{ type: string, empresa: any }>();

  getInitials(name: string): string {
    if (!name) return '??';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  getUsagePercent(current: number = 0, max: any = 0): number {
    if (!max || max === '-' || max <= 0) return 0;
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

  getPersonaLabel(code: string): string {
    return GET_PERSONA_LABEL(code);
  }

  getContribuyenteLabel(code: string): string {
    return GET_CONTRIBUYENTE_LABEL(code);
  }
}
