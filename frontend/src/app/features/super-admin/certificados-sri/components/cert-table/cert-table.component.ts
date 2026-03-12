import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SriCertConfig } from '../../services/sri-cert.service';

@Component({
    selector: 'app-cert-table',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="table-container-lux">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th class="ps-4">Empresa</th>
              <th>Estado SRI</th>
              <th>Vencimiento</th>
              <th>Días Restantes</th>
              <th class="pe-4 text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cert of certificados" class="row-lux">
              
              <!-- Empresa Info -->
              <td class="ps-4">
                <div class="d-flex align-items-center gap-3">
                  <div class="avatar-soft-lux" style="background: rgba(22, 29, 53, 0.1); color: #161d35;">
                    {{ (cert.empresa_nombre || 'N').charAt(0) }}
                  </div>
                  <div>
                    <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.95rem;">{{ cert.empresa_nombre || 'No asignada' }}</h6>
                    <span class="text-secondary small d-flex align-items-center gap-1">
                      <i class="bi bi-hash"></i> {{ cert.empresa_ruc || 'Sin RUC' }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Estado Badge -->
              <td>
                 <div class="d-flex flex-column gap-1">
                    <div class="badge-status-lux" [ngClass]="getStatusClass(cert)">
                        <div class="dot"></div>
                        {{ cert.estado }}
                    </div>
                    <span class="text-secondary opacity-75 fw-bold ms-1" style="font-size: 0.65rem;">
                        {{ cert.ambiente }}
                    </span>
                 </div>
              </td>

              <!-- Fecha Vencimiento -->
              <td>
                 <div class="d-flex flex-column">
                    <span class="fw-bold text-dark">{{ cert.fecha_expiracion_cert | date:'dd MMM, yyyy' }}</span>
                    <span class="text-muted small">{{ cert.fecha_expiracion_cert | date:'shortTime' }}</span>
                 </div>
              </td>

              <!-- Días Restantes -->
              <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="progress flex-grow-1" style="height: 6px; width: 80px; background-color: #e2e8f0;">
                        <div class="progress-bar rounded-pill" role="progressbar" 
                             [style.width.%]="getExpiryProgress(cert.days_until_expiry)"
                             [ngClass]="{
                                'bg-success': (cert.days_until_expiry || 0) > 30,
                                'bg-warning': (cert.days_until_expiry || 0) <= 30 && (cert.days_until_expiry || 0) > 0,
                                'bg-danger': (cert.days_until_expiry || 0) <= 0
                             }">
                        </div>
                    </div>
                    <span class="fw-bold small" 
                          [ngClass]="{
                             'text-danger': (cert.days_until_expiry || 0) <= 0,
                             'text-warning': (cert.days_until_expiry || 0) > 0 && (cert.days_until_expiry || 0) <= 30,
                             'text-success': (cert.days_until_expiry || 0) > 30
                          }">{{ (cert.days_until_expiry || 0) > 0 ? (cert.days_until_expiry + ' días') : 'VENCIDO' }}</span>
                </div>
              </td>

              <!-- Acciones -->
              <td class="text-end pe-4">
                 <div class="dropdown">
                    <button class="btn-trigger-lux dropdown-toggle-kebab" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                       <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-4" style="min-width: 180px;">
                       <li>
                          <button class="dropdown-item d-flex align-items-center gap-2 py-2" (click)="onViewDetails.emit(cert)">
                             <i class="bi bi-eye text-primary"></i> Ver detalles
                          </button>
                       </li>
                    </ul>
                 </div>
              </td>

            </tr>
          </tbody>
          <!-- Empty State -->
          <tfoot *ngIf="certificados.length === 0">
            <tr>
              <td colspan="6" class="text-center py-5">
                <div class="d-flex flex-column align-items-center opacity-50">
                  <i class="bi bi-shield-x display-4 mb-2 text-secondary"></i>
                  <h6 class="text-secondary fw-bold">No se encontraron certificados</h6>
                  <p class="small text-muted mb-0">Intenta ajustar los filtros de búsqueda</p>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `,
    styles: [`
    .table-container-lux {
      background: white; border: 1px solid #f1f5f9; border-radius: 24px;
      overflow: visible; margin-top: 1rem;
    }
    .table-responsive { overflow: visible; }
    .table thead th {
      background: #fcfdfe; padding: 1.25rem 1rem; font-size: 0.65rem;
      text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;
      font-weight: 800; border-bottom: 1px solid #f1f5f9;
    }
    .row-lux { transition: background-color 0.2s; }
    .row-lux:hover { background-color: #f8fafc; }
    .table tbody td { padding: 1.25rem 1rem; border-bottom: 1px solid #fcfdfe; }
    
    .avatar-soft-lux {
      width: 36px; height: 36px; border-radius: 10px; display: flex;
      align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem;
    }
    
    .badge-status-lux {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.8rem;
      border-radius: 10px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
    }
    .badge-status-lux .dot { width: 6px; height: 6px; border-radius: 50%; }
    
    .status-autorizada { background: #ecfdf5; color: #065f46; }
    .status-autorizada .dot { background: #10b981; }
    .status-proceso { background: #fffbeb; color: #92400e; }
    .status-proceso .dot { background: #f59e0b; }
    .status-error { background: #fef2f2; color: #991b1b; }
    .status-error .dot { background: #ef4444; }

    .btn-trigger-lux {
      background: transparent; border: none; width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8; transition: all 0.2s;
    }
    .btn-trigger-lux:hover { background: #f1f5f9; color: #161d35; }
    
    /* Hide dropdown toggle caret */
    .dropdown-toggle-kebab::after {
      display: none;
    }
  `]
})
export class CertTableComponent {
    @Input() certificados: SriCertConfig[] = [];
    @Output() onViewHistory = new EventEmitter<SriCertConfig>();
    @Output() onViewDetails = new EventEmitter<SriCertConfig>();

    getStatusClass(cert: SriCertConfig): string {
        if (cert.estado === 'ACTIVO' && (cert.days_until_expiry || 0) > 30) return 'status-autorizada';
        if (cert.estado === 'ACTIVO' && (cert.days_until_expiry || 0) <= 30) return 'status-proceso';
        return 'status-error'; // Vencido o revocado
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
