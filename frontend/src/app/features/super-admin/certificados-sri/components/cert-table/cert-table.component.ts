import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SriCertConfig } from '../../services/sri-cert.service';

@Component({
    selector: 'app-cert-table',
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
                <th style="width: 140px">Ambiente</th>
                <th style="width: 140px">Estado</th>
                <th style="width: 160px">Vencimiento</th>
                <th style="width: 180px">Días Restantes</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cert of certificados">
                <!-- Empresa Info -->
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-2">
                      {{ (cert.empresa_nombre || 'N').charAt(0) }}
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-main d-block mb-0 text-truncate" [title]="cert.empresa_nombre || 'No asignada'">
                        {{ cert.empresa_nombre || 'No asignada' }}
                      </span>
                      <small class="text-muted d-flex align-items-center gap-1" style="font-size: 0.7rem;">
                        <i class="bi bi-hash"></i> {{ cert.empresa_ruc || 'Sin RUC' }}
                      </small>
                    </div>
                  </div>
                </td>
  
                <!-- Ambiente -->
                <td>
                   <span class="badge-status-premium" [ngClass]="cert.ambiente === 'PRODUCCION' ? 'ambiente-prod' : 'ambiente-pruebas'">
                       {{ cert.ambiente }}
                   </span>
                </td>

                <!-- Estado -->
                <td>
                   <span class="badge-status-premium" [ngClass]="getStatusClass(cert)">
                       {{ cert.estado }}
                   </span>
                </td>
  
                <!-- Vencimiento -->
                <td>
                   <div class="d-flex flex-column">
                      <span class="text-main fw-600" style="font-size: 0.85rem;">{{ cert.fecha_expiracion_cert | date:'dd MMM, yyyy' }}</span>
                      <small class="text-muted" style="font-size: 0.7rem;">{{ cert.fecha_expiracion_cert | date:'shortTime' }}</small>
                   </div>
                </td>
  
                <!-- Días Restantes -->
                <td>
                  <div class="d-flex align-items-center gap-2">
                      <div class="progress flex-grow-1" style="height: 6px; width: 60px; background-color: var(--border-color);">
                          <div class="progress-bar rounded-pill" role="progressbar" 
                               [style.width.%]="getExpiryProgress(cert.days_until_expiry)"
                               [ngClass]="{
                                  'bg-success': (cert.days_until_expiry || 0) > 30,
                                  'bg-warning': (cert.days_until_expiry || 0) <= 30 && (cert.days_until_expiry || 0) > 0,
                                  'bg-danger': (cert.days_until_expiry || 0) <= 0
                                }">
                          </div>
                      </div>
                      <span class="fw-bold fs-7" 
                            [ngClass]="{
                               'text-danger': (cert.days_until_expiry || 0) <= 0,
                               'text-warning': (cert.days_until_expiry || 0) > 0 && (cert.days_until_expiry || 0) <= 30,
                               'text-success': (cert.days_until_expiry || 0) > 30
                            }">{{ (cert.days_until_expiry || 0) > 0 ? (cert.days_until_expiry + 'd') : 'VENCIDO' }}</span>
                  </div>
                </td>
  
                <!-- Acciones -->
                <td class="text-end">
                   <div class="dropdown">
                      <button 
                         class="btn-action-trigger" 
                         type="button" 
                         data-bs-toggle="dropdown" 
                         aria-expanded="false"
                         data-bs-popper-config='{"strategy":"fixed"}'
                      >
                         <i class="bi bi-three-dots"></i>
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4">
                         <li>
                            <button class="dropdown-item rounded-3 py-2" (click)="onViewDetails.emit(cert)">
                               <i class="bi bi-eye text-corporate"></i>
                               <span class="ms-2">Ver Detalles</span>
                            </button>
                         </li>
                         <li *ngIf="false">
                            <button class="dropdown-item rounded-3 py-2" (click)="onViewHistory.emit(cert)">
                               <i class="bi bi-clock-history text-corporate"></i>
                               <span class="ms-2">Historial</span>
                            </button>
                         </li>
                      </ul>
                   </div>
                </td>
  
              </tr>
              <tr *ngIf="certificados.length === 0">
                <td colspan="6" class="text-center p-5 text-muted">
                  <i class="bi bi-shield-x fs-1 d-block mb-3"></i>
                  No se encontraron certificados configurados.
                </td>
              </tr>
            </tbody>
>
          </table>
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
    }
    .table-container {
      background: var(--bg-main, #ffffff);
      border-radius: 20px;
      border: 1px solid var(--border-color, #f1f5f9);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    .table-responsive-premium { 
      flex: 1;
      overflow-y: auto; 
      overflow-x: auto;
      position: relative; 
    }
    .table thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bg-main, #ffffff);
      padding: 1rem 1.5rem;
      font-size: var(--text-base);
      color: var(--text-main);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--border-color);
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: var(--text-md);
    }
    
    .avatar-soft-premium {
      width: 38px; height: 38px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: var(--text-base);
      background: var(--primary-color);
      color: #ffffff;
    }
    
    .badge-status-premium {
      padding: 0.35rem 0.85rem;
      border-radius: 6px;
      font-size: var(--text-xs);
      font-weight: 800;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-status-premium.activo { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-premium.vencido { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .badge-status-premium.por-vencer { background: var(--status-warning-bg); color: var(--status-warning-text); }

    .ambiente-prod { background: var(--status-info-bg); color: var(--status-info-text); }
    .ambiente-pruebas { background: var(--status-neutral-bg); color: var(--status-neutral-text); }

    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: var(--text-muted);
      transition: all 0.2s;
    }
    .btn-action-trigger:hover {
      background: var(--status-info-bg); color: var(--status-info-text);
    }
    
    .dropdown-item {
      display: flex; align-items: center; padding: 0.6rem 1rem;
      font-size: var(--text-base); font-weight: 600;
      color: var(--text-muted); cursor: pointer;
      transition: all 0.2s;
    }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    .dropdown-item:hover { background: var(--status-info-bg); color: var(--status-info-text); }

    .bg-success { background-color: var(--status-success) !important; }
    .bg-warning { background-color: var(--status-warning) !important; }
    .bg-danger { background-color: var(--status-danger) !important; }
    
    .text-success { color: var(--status-success) !important; }
    .text-warning { color: var(--status-warning) !important; }
    .text-danger { color: var(--status-danger) !important; }
    .text-main { color: var(--text-main) !important; }
    
    .fw-600 { font-weight: 600; }
    .fw-800 { font-weight: 800; }
    .text-corporate { color: var(--primary-color) !important; }
    .fs-7 { font-size: 0.8rem; }
  `]
})
export class CertTableComponent {
    @Input() certificados: SriCertConfig[] = [];
    @Output() onViewHistory = new EventEmitter<SriCertConfig>();
    @Output() onViewDetails = new EventEmitter<SriCertConfig>();

    getStatusClass(cert: SriCertConfig): string {
        if (cert.estado === 'ACTIVO' && (cert.days_until_expiry || 0) > 30) return 'activo';
        if (cert.estado === 'ACTIVO' && (cert.days_until_expiry || 0) <= 30) return 'por-vencer';
        return 'vencido'; // Vencido o revocado
    }

    getExpiryProgress(days: number | undefined): number {
        if (!days) return 0;
        if (days < 0) return 100; // Full bar for expired but red
        // Cap at 365 days = 100%, 0 days = 0% logic inverted? 
        // Usually progress bar implies "health" or "time remaining". 
        // Let's say 365 days is full bar (safe). 
        return Math.min(Math.max((days / 365) * 100, 5), 100);
    }
}
