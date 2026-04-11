import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container animate__animated animate__fadeIn">
      <div class="table-header-info">
        <h5 class="mb-0">Mis Empresas</h5>
        <span class="badge bg-primary-light text-primary">{{ data.length || 0 }} Clientes</span>
      </div>
      
      <div class="table-responsive">
        <table class="table custom-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Plan</th>
              <th class="text-center">% de Uso</th>
              <th class="text-center">Oportunidad</th>
              <th>Próx. Venc.</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of data">
              <td>
                <div class="d-flex align-items-center">
                  <span class="fw-bold me-2">{{ e.empresa }}</span>
                  <i class="bi bi-info-circle text-primary cursor-pointer" 
                     [title]="'Antigüedad: ' + e.antiguedad"></i>
                </div>
              </td>
              <td>
                <span class="plan-badge">{{ e.plan }}</span>
              </td>
              <td class="text-center">
                <div class="usage-container">
                  <div class="progress" style="height: 6px;">
                    <div class="progress-bar" 
                         [ngClass]="getUsageClass(e.porcentaje_uso)"
                         [style.width.%]="e.porcentaje_uso"></div>
                  </div>
                  <small class="usage-text">{{ e.porcentaje_uso }}%</small>
                </div>
              </td>
              <td class="text-center">
                <span class="badge" [ngClass]="e.oportunidad_upgrade === 'Si' ? 'bg-success' : 'bg-light text-muted'">
                  {{ e.oportunidad_upgrade }}
                </span>
              </td>
              <td [ngClass]="getExpiracyClass(e.prox_venc_fmt)">
                {{ e.prox_venc_fmt }}
              </td>
              <td>
                <span class="badge-status" [class.active]="e.estado === 'ACTIVA'">
                  {{ e.estado }}
                </span>
              </td>
            </tr>
            <tr *ngIf="!data || data.length === 0">
              <td colspan="6" class="text-center py-5">
                <i class="bi bi-buildings fs-1 d-block mb-2 text-muted"></i>
                <p class="text-muted">No tienes empresas registradas en este periodo.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; }
    .table-header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    
    .custom-table { margin: 0; }
    .custom-table thead th { 
      background: #f8fafc; color: #64748b; font-size: 0.7rem; font-weight: 800; 
      text-transform: uppercase; letter-spacing: 0.05em; padding: 1rem; border: none;
    }
    .custom-table tbody td { padding: 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    
    .plan-badge { background: #f1f5f9; color: #475569; padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
    
    .usage-container { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
    .usage-text { font-weight: 700; font-size: 0.7rem; color: #64748b; }
    
    .bg-primary-light { background: #eff6ff; }
    
    .badge-status {
      padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700;
      background: #fee2e2; color: #dc2626;
    }
    .badge-status.active { background: #dcfce7; color: #16a34a; }
    
    .text-danger-strong { color: #dc2626; font-weight: 800; }
    .text-warning-strong { color: #d97706; font-weight: 700; }
    
    .cursor-pointer { cursor: pointer; }
  `]
})
export class EmpresasListComponent {
  @Input() data: any[] = [];

  getUsageClass(pct: number): string {
    if (pct >= 80) return 'bg-danger';
    if (pct >= 50) return 'bg-warning';
    return 'bg-success';
  }

  getExpiracyClass(fmt: string): string {
    if (fmt.includes('menos de 5 días')) return 'text-danger-strong';
    if (fmt.includes('menos de 1 mes')) return 'text-warning-strong';
    return '';
  }
}
