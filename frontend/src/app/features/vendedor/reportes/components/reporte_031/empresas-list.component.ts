import { Component, Input } from '@angular/core';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoTooltipComponent],
  template: `
    <div class="table-container animate__animated animate__fadeIn">
      <div class="table-header-info">
        <h5 class="mb-0">Mis Empresas</h5>
        <span class="badge bg-primary-light text-primary">{{ data.length || 0 }} Clientes</span>
      </div>
      
      <div class="tabla-scroll">
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
            <tr *ngFor="let e of paginatedData">
              <td>
                <div class="d-flex align-items-center">
                  <span class="fw-bold me-2">{{ e.empresa }}</span>
                  <app-info-tooltip 
                    [message]="'Administrador principal:\n• ' + e.admin_nombre + '\n• Creado: ' + e.admin_fecha_fmt + '\n• Tiempo: ' + e.admin_antiguedad">
                  </app-info-tooltip>
                </div>
              </td>
              <td>
                <span class="plan-badge">{{ e.plan }}</span>
              </td>
              <td class="text-center">
                <div class="usage-container" 
                     [title]="'Uso Detallado:\n' + 
                              '• Facturas: ' + e.facturas_actuales + '/' + e.max_facturas_mes + '\n' +
                              '• Usuarios: ' + e.usuarios_actuales + '/' + e.max_usuarios + '\n' +
                              '• Establecimientos: ' + e.establecimientos_actuales + '/' + e.max_establecimientos + '\n' +
                              '• Programadas: ' + e.programadas_actuales + '/' + e.max_programaciones">
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
        <!-- Paginación footer -->
        <div class="pagination-premium-container">
          <div class="d-flex align-items-center justify-content-between px-4 py-3">
            <div class="d-flex align-items-center gap-3">
              <span class="pag-label">Registros por página:</span>
              <select class="form-select-premium-sm" [(ngModel)]="pageSize" (change)="onPageSizeChange($event)">
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
            </div>
            <div class="text-center">
              <span class="pag-info">
                Mostrando <strong>{{ startItem }} - {{ endItem }}</strong> de <strong>{{ data.length }}</strong> registros
              </span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button class="btn-nav-premium" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">
                <i class="bi bi-chevron-left"></i>
              </button>
              <div class="page-indicator-premium">{{ currentPage }}</div>
              <button class="btn-nav-premium" [disabled]="currentPage === totalPages" (click)="currentPage = currentPage + 1">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
    </div>
  `,
  styles: [`
    .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; }
    .table-header-info { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; }

    .tabla-scroll { max-height: 575px; overflow-y: auto; overflow-x: auto; }
    .custom-table { margin: 0; }
    .custom-table thead th {
      background: #f8fafc; color: #64748b; font-size: 0.7rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.05em; padding: 1rem; border: none;
      position: sticky; top: 0; z-index: 1;
    }
    .custom-table tbody td { padding: 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    .custom-table tbody tr:hover td { background: #f8fafc; }

    .plan-badge { background: #f1f5f9; color: #475569; padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
    .usage-container { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
    .usage-text { font-weight: 700; font-size: 0.7rem; color: #64748b; }
    .bg-primary-light { background: #eff6ff; }
    .badge-status { padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; background: #fee2e2; color: #dc2626; }
    .badge-status.active { background: #dcfce7; color: #16a34a; }
    .text-danger-strong { color: #dc2626; font-weight: 800; }
    .text-warning-strong { color: #d97706; font-weight: 700; }

    .pagination-premium-container { background: #fff; border-top: 1px solid #e2e8f0; }
    .pag-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; }
    .pag-info { font-size: 0.85rem; color: #64748b; }
    .form-select-premium-sm { padding: 0.4rem 2rem 0.4rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 0.85rem; font-weight: 600; color: #475569; cursor: pointer; }
    .btn-nav-premium { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-nav-premium:hover:not(:disabled) { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
    .btn-nav-premium:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-indicator-premium { min-width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #161d35; color: white; font-weight: 700; font-size: 0.9rem; padding: 0 0.75rem; }
  `]
})
export class EmpresasListComponent {
  private _data: any[] = [];
  @Input() set data(val: any[]) { this._data = val || []; this.currentPage = 1; }
  get data(): any[] { return this._data; }

  currentPage = 1;
  pageSize = 10;

  get paginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._data.slice(start, start + this.pageSize);
  }
  get totalPages() { return Math.ceil(this._data.length / this.pageSize) || 1; }
  get startItem() { return this._data.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get endItem() { return Math.min(this.currentPage * this.pageSize, this._data.length); }
  onPageSizeChange(e: Event) { this.pageSize = +(e.target as HTMLSelectElement).value; this.currentPage = 1; }

  getUsageClass(pct: number): string {
    if (pct >= 80) return 'bg-danger';
    if (pct >= 50) return 'bg-warning';
    return 'bg-success';
  }

  getExpiracyClass(fmt: string): string {
    if (fmt.includes('menos de 5 días')) return 'text-danger-strong';
    if (fmt.includes('menos de 30 días')) return 'text-warning-strong';
    return '';
  }
}
