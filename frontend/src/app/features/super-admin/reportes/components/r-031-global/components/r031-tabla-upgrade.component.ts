import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaZonaUpgrade } from '../../../services/reportes.service';

@Component({
  selector: 'app-r031-tabla-upgrade',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card-tabla shadow-sm">
      <div class="tabla-header d-flex justify-content-between align-items-center p-3">
        <h6 class="mb-0"><i class="bi bi-graph-up text-success me-2"></i>Zona de Upgrade (Uso Crítico de Plan)</h6>
        <span class="badge bg-success-subtle text-success">{{ empresas.length }} empresas</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Plan Actual</th>
              <th class="text-center">Límite Facturas</th>
              <th class="text-center">Uso Mes</th>
              <th>Progreso de Uso</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of paginatedEmpresas">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="avatar-sm bg-success-subtle text-success">{{ e.nombre_empresa.charAt(0) }}</div>
                  <span class="fw-bold text-dark">{{ e.nombre_empresa }}</span>
                </div>
              </td>
              <td><span class="badge bg-light text-dark border">{{ e.plan_nombre }}</span></td>
              <td class="text-center"><span class="fw-medium">{{ e.max_facturas_mes }}</span></td>
              <td class="text-center text-primary-emphasis fw-bold">{{ e.facturas_mes }}</td>
              <td>
                <div class="progress-container">
                  <div class="progress" style="height: 8px;">
                    <div class="progress-bar" 
                      [ngClass]="getProgressClass(e.porcentaje_uso)"
                      role="progressbar" 
                      [style.width.%]="e.porcentaje_uso > 100 ? 100 : e.porcentaje_uso"
                      [attr.aria-valuenow]="e.porcentaje_uso" 
                      aria-valuemin="0" 
                      aria-valuemax="100">
                    </div>
                  </div>
                  <small class="ms-2 fw-bold" [ngClass]="getTextClass(e.porcentaje_uso)">{{ e.porcentaje_uso }}%</small>
                </div>
              </td>
            </tr>
            <tr *ngIf="empresas.length === 0">
              <td colspan="5" class="text-center py-5 text-muted">
                <i class="bi bi-bar-chart fs-1 d-block mb-2 text-muted opacity-50"></i>
                No hay empresas identificadas con uso crítico en este periodo.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Paginación footer -->
      <div class="pagination-premium-container">
        <div class="d-flex align-items-center justify-content-between px-4 py-3">
          <div class="d-flex align-items-center gap-3">
            <span class="text-muted fw-600" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Registros por página:</span>
            <select class="form-select-premium-sm" [(ngModel)]="pageSize" (change)="onPageSizeChange($event)">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
          </div>
          <div class="text-center">
            <span class="text-muted fw-500" style="font-size: 0.85rem;">
              Mostrando <strong class="text-dark">{{ startItem }} - {{ endItem }}</strong> de <strong class="text-dark">{{ empresas.length }}</strong> registros
            </span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn-nav-premium" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1" title="Anterior">
              <i class="bi bi-chevron-left"></i>
            </button>
            <div class="page-indicator-premium">{{ currentPage }}</div>
            <button class="btn-nav-premium" [disabled]="currentPage === totalPages" (click)="currentPage = currentPage + 1" title="Siguiente">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-tabla { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; }
    .card-tabla .table-responsive { max-height: 575px; overflow-y: auto; }
    .tabla-header { background: #f0fdf4; border-bottom: 1px solid #dcfce7; }
    .pagination-premium-container { background: #ffffff; border-top: 1px solid #e2e8f0; }
    .form-select-premium-sm { padding: 0.4rem 2rem 0.4rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 0.85rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
    .form-select-premium-sm:focus { border-color: var(--primary-color); outline: none; }
    .btn-nav-premium { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; cursor: pointer; }
    .btn-nav-premium:hover:not(:disabled) { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
    .btn-nav-premium:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-indicator-premium { min-width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--primary-color); color: white; font-weight: 700; font-size: 0.9rem; padding: 0 0.75rem; }
    .fw-600 { font-weight: 600; }
    .fw-500 { font-weight: 500; }
    
    th { background: #f8fafc; padding: 0.75rem 1rem; font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    
    .avatar-sm { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; }
    
    .progress-container { display: flex; align-items: center; min-width: 150px; }
    .progress { flex: 1; background-color: #f1f5f9; border-radius: 10px; }
    
    .bg-success-subtle { background-color: #dcfce7 !important; }
    .text-success { color: #166534 !important; }
  `]
})
export class R031TablaUpgradeComponent {
  @Input() empresas: EmpresaZonaUpgrade[] = [];

  currentPage = 1;
  pageSize = 10;

  get paginatedEmpresas() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.empresas.slice(start, start + this.pageSize);
  }
  get totalPages() { return Math.ceil(this.empresas.length / this.pageSize) || 1; }
  get startItem() { return this.empresas.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get endItem() { return Math.min(this.currentPage * this.pageSize, this.empresas.length); }

  onPageSizeChange(event: Event) {
    this.pageSize = +(event.target as HTMLSelectElement).value;
    this.currentPage = 1;
  }

  getProgressClass(pct: number): string {
    if (pct >= 95) return 'bg-danger';
    if (pct >= 80) return 'bg-warning';
    return 'bg-success';
  }

  getTextClass(pct: number): string {
    if (pct >= 95) return 'text-danger';
    if (pct >= 80) return 'text-warning';
    return 'text-success';
  }
}
