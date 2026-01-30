import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SriCertConfig } from '../../services/sri-cert.service';

@Component({
    selector: 'app-cert-table',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="table-container bg-white rounded-4 shadow-sm border p-0 overflow-hidden animate__animated animate__fadeIn">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="bg-light">
            <tr>
              <th class="ps-4 py-3 text-secondary text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 1px;">Empresa</th>
              <th class="py-3 text-secondary text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 1px;">Estado SRI</th>
              <th class="py-3 text-secondary text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 1px;">Vencimiento</th>
              <th class="py-3 text-secondary text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 1px;">Días Restantes</th>
              <th class="py-3 text-secondary text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 1px;">Emisor</th>
              <th class="pe-4 py-3 text-end text-secondary text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 1px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cert of certificados" class="hover-row transition-all">
              
              <!-- Empresa Info -->
              <td class="ps-4 py-3">
                <div class="d-flex align-items-center gap-3">
                  <div class="avatar-sm rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                       style="width: 40px; height: 40px; background: #161d35; font-size: 1rem;">
                    {{ cert.empresa_nombre.charAt(0) }}
                  </div>
                  <div>
                    <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.95rem;">{{ cert.empresa_nombre }}</h6>
                    <span class="text-secondary small d-flex align-items-center gap-1">
                      <i class="bi bi-hash"></i> {{ cert.empresa_ruc }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Estado Badge -->
              <td class="py-3">
                 <div class="d-flex flex-column gap-1">
                    <span class="badge rounded-pill fw-bold" 
                        [ngClass]="{
                            'bg-success-subtle text-success border border-success-subtle': cert.estado === 'ACTIVO' && (cert.days_until_expiry || 0) > 30,
                            'bg-warning-subtle text-warning border border-warning-subtle': cert.estado === 'ACTIVO' && (cert.days_until_expiry || 0) <= 30,
                            'bg-danger-subtle text-danger border border-danger-subtle': cert.estado === 'EXPIRADO' || cert.estado === 'REVOCADO'
                        }"
                        style="width: fit-content; padding: 0.4em 0.8em;">
                        <i class="bi me-1" 
                           [ngClass]="{
                                'bi-check-circle-fill': cert.estado === 'ACTIVO' && (cert.days_until_expiry || 0) > 30,
                                'bi-exclamation-triangle-fill': cert.estado === 'ACTIVO' && (cert.days_until_expiry || 0) <= 30,
                                'bi-x-circle-fill': cert.estado === 'EXPIRADO' || cert.estado === 'REVOCADO'
                           }"></i>
                        {{ cert.estado }}
                    </span>
                    <span class="badge bg-light text-secondary border rounded-pill" style="width: fit-content; font-size: 0.7rem;">
                        {{ cert.ambiente }}
                    </span>
                 </div>
              </td>

              <!-- Fecha Vencimiento -->
              <td class="py-3">
                 <div class="d-flex flex-column">
                    <span class="fw-bold text-dark">{{ cert.fecha_expiracion_cert | date:'mediumDate' }}</span>
                    <span class="text-muted small">{{ cert.fecha_expiracion_cert | date:'shortTime' }}</span>
                 </div>
              </td>

              <!-- Días Restantes -->
              <td class="py-3">
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

              <!-- Emisor -->
              <td class="py-3">
                <span class="text-secondary small fw-medium d-block text-truncate" style="max-width: 150px;" title="{{cert.cert_emisor}}">
                    {{ cert.cert_emisor }}
                </span>
                <span class="text-muted small" style="font-size: 0.7rem;">Serial: {{ cert.cert_serial }}</span>
              </td>

              <!-- Acciones -->
              <td class="pe-4 py-3 text-end">
                <button class="btn btn-sm btn-white border shadow-sm rounded-pill px-3 fw-bold text-secondary hover-primary"
                        (click)="onViewHistory.emit(cert)">
                  <i class="bi bi-clock-history me-1"></i> Historial
                </button>
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
    .hover-row:hover { background-color: #f8fafc; }
    .btn-white { background: white; transition: all 0.2s; }
    .btn-white:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); color: #161d35 !important; border-color: #161d35 !important; }
    
    .table > :not(caption) > * > * { border-bottom-color: #f1f5f9; }
  `]
})
export class CertTableComponent {
    @Input() certificados: SriCertConfig[] = [];
    @Output() onViewHistory = new EventEmitter<SriCertConfig>();

    getExpiryProgress(days: number | undefined): number {
        if (!days) return 0;
        if (days < 0) return 100; // Full bar for expired but red
        // Cap at 365 days = 100%, 0 days = 0% logic inverted? 
        // Usually progress bar implies "health" or "time remaining". 
        // Let's say 365 days is full bar (safe). 
        return Math.min(Math.max((days / 365) * 100, 5), 100);
    }
}
