import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empresa-table',
  template: `
    <section class="module-table">
      <div class="table-container border-0 shadow-premium">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Empresa</th>
                <th style="width: 130px">Estado</th>
                <th style="width: 180px">Plan Actual</th>
                <th style="width: 140px">Vendedor</th>
                <th style="width: 160px">Uso de Recursos</th>
                <th style="width: 140px">Vencimiento</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let empresa of empresas">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-3" [style.background]="getAvatarColor(empresa.razonSocial, 0.1)" [style.color]="getAvatarColor(empresa.razonSocial, 1)">
                      {{ getInitials(empresa.razonSocial) }}
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block mb-0">{{ empresa.razonSocial }}</span>
                      <small class="text-muted font-mono" style="font-size: 0.7rem;">{{ empresa.ruc }}</small>
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
                    <span class="text-corporate fw-800" style="font-size: 0.85rem;">{{ empresa.plan || 'Sin Plan' }}</span>
                    <small class="text-muted" style="font-size: 0.7rem;">{{ empresa.tipo_contribuyente }}</small>
                  </div>
                </td>
                <td>
                  <div class="d-flex align-items-center" *ngIf="empresa.vendedorName; else noVendedor">
                    <div class="vendedor-dot me-2"></div>
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
                    <span class="fw-bold" [class.text-danger]="isExpired(empresa.fechaVencimiento)" style="font-size: 0.85rem;">
                      {{ empresa.fechaVencimiento | date:'dd/MM/yyyy' }}
                    </span>
                    <small class="text-muted" style="font-size: 0.7rem;" *ngIf="!isExpired(empresa.fechaVencimiento)">
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
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + empresa.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view_details', empresa})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Expediente</span>
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
    .module-table { margin-top: 1rem; }
    .table-container {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      overflow: visible !important;
    }
    .table-responsive-premium { overflow: overflow: visible !important; position: relative; }
    .table thead th {
      background: #f8fafc;
      padding: 1.15rem 1.5rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 800;
      border-bottom: 2px solid #f1f5f9;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f8fafc;
    }
    
    .avatar-soft-premium {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.85rem;
    }
    
    .badge-status-premium {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.7rem; font-weight: 800;
      text-transform: uppercase;
    }
    .badge-status-premium.activo { background: #dcfce7; color: #15803d; }
    .badge-status-premium.inactivo { background: #fee2e2; color: #b91c1c; }
    .badge-status-premium.vencida { background: #fef9c3; color: #a16207; }

    .vendedor-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #6366f1;
    }
    
    .usage-container { width: 100%; max-width: 120px; }
    .progress-premium {
      height: 6px;
      background: #f1f5f9;
      border-radius: 10px;
      overflow: hidden;
    }
    .progress-bar-premium {
      height: 100%;
      background: #161d35;
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    
    .btn-action-trigger {
      background: #f8fafc; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #161d35; color: #ffffff;
    }
    
    .dropdown-menu {
      z-index: 100000 !important;
      min-width: 220px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.25) !important;
      padding: 0.75rem !important;
      position: fixed !important;
    }
    .dropdown-item {
      font-size: 0.85rem; font-weight: 600;
      color: #475569; padding: 0.65rem 1rem;
      display: flex; align-items: center;
      border-radius: 10px !important;
    }
    .dropdown-item:hover { background: #f8fafc; color: #161d35; }
    .dropdown-item i { font-size: 1.1rem; }
    
    .fw-800 { font-weight: 800; }
    .fw-600 { font-weight: 600; }
    .text-corporate { color: #161d35 !important; }
    .font-mono { font-family: 'DM Mono', monospace; }
    .shadow-premium { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04); }
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

  getAvatarColor(name: string, opacity: number): string {
    const colors = [
      `rgba(99, 102, 241, ${opacity})`, // Indigo
      `rgba(16, 185, 129, ${opacity})`, // Emerald
      `rgba(245, 158, 11, ${opacity})`, // Amber
      `rgba(239, 68, 68, ${opacity})`,  // Rose
      `rgba(139, 92, 246, ${opacity})`, // Violet
      `rgba(20, 184, 166, ${opacity})`  // Teal
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
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
}
