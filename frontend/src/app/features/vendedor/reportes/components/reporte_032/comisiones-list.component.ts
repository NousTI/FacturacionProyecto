import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-comisiones-list',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoTooltipComponent],
  template: `
    <div class="table-container animate__animated animate__fadeIn">
      <div class="table-header-info mb-3">
        <h5 class="mb-0">Historial de Comisiones</h5>
        <span class="badge bg-primary-light text-primary">{{ data.length || 0 }} Registros</span>
      </div>
      
      <div class="tabla-scroll">
        <table class="table custom-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Fecha de la Venta</th>
              <th>Plan</th>
              <th class="text-end">Mi Comisión</th>
              <th class="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of paginatedData">
              <td><span class="fw-bold">{{ c.empresa }}</span></td>
              <td><span class="text-muted">{{ formatFechaRelativa(c.fecha_venta) }}</span></td>
              <td><span class="plan-badge">{{ c.plan }}</span></td>
              <td class="text-end fw-bold text-success">{{ c.mi_comision | currency }}</td>
              <td class="text-center">
                <div class="d-flex align-items-center justify-content-center">
                  <span class="badge-status" 
                        [class.pagada]="c.estado === 'PAGADA'"
                        [class.aprobada]="c.estado === 'APROBADA'"
                        [class.pendiente]="c.estado === 'PENDIENTE'">
                    {{ c.estado_display || c.estado }}
                  </span>
                  
                  <app-info-tooltip 
                    *ngIf="c.estado === 'PENDIENTE'"
                    message="en espera de ciclo de pago"
                    icon="bi-info-circle">
                  </app-info-tooltip>
                </div>
              </td>
            </tr>
            <tr *ngIf="!data || data.length === 0">
              <td colspan="5" class="text-center py-5 text-muted">
                <i class="bi bi-cash-stack fs-1 d-block mb-2"></i>
                No hay registros de comisiones para este periodo.
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
    .badge-status { padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; background: #f1f5f9; color: #64748b; }
    .badge-status.pagada { background: #dcfce7; color: #16a34a; }
    .badge-status.aprobada { background: #eff6ff; color: #2563eb; }
    .badge-status.pendiente { background: #fef9c3; color: #854d0e; }
    .bg-primary-light { background: #eff6ff; }

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
export class ComisionesListComponent {
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

  formatFechaRelativa(fecha: string | Date | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '—';
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((hoy.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'hoy';
    if (diff === 1) return 'ayer';
    if (diff > 1 && diff <= 30) return `hace ${diff} días`;
    return new Date(fecha).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
