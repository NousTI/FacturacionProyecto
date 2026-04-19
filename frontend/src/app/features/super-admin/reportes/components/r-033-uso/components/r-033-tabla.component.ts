import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-r-033-tabla',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card-tabla">
      <div class="tabla-header d-flex justify-content-between align-items-center">
        <span><i class="bi bi-table me-2"></i>Uso por empresa ({{ empresas.length }} empresas)</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Empresa</th>
              <th class="text-center">Usuarios</th>
              <th class="text-center">Fact. Periodo</th>
              <th>% de uso</th>
              <th class="text-center">Módulos</th>
              <th>Último acceso</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of paginatedEmpresas">
              <td>
                <div class="d-flex flex-column">
                  <span class="fw-bold text-dark">{{ e.empresa }}</span>
                  <span class="text-muted small badge bg-light text-dark border align-self-start">{{ e.plan_nombre || 'Sin plan' }}</span>
                </div>
              </td>
              <td class="text-center">
                <span class="fw-semibold">{{ e.usuarios_activos }}</span><span class="text-muted small">/{{ e.total_usuarios }}</span>
              </td>
              <td class="text-center">
                <span class="fw-semibold">{{ e.facturas_mes }}</span><span class="text-muted small">/{{ e.max_facturas_mes || '∞' }}</span>
              </td>
              <td>
                <div class="progress-container">
                  <div class="progress-bar-stack">
                    <div class="progress-fill"
                      [style.width.%]="e.porcentaje_uso > 100 ? 100 : e.porcentaje_uso"
                      [ngClass]="getUsoClass(e.porcentaje_uso)">
                    </div>
                  </div>
                  <span class="progress-text fw-bold" [ngClass]="getUsoTextClass(e.porcentaje_uso)">{{ e.porcentaje_uso }}%</span>
                </div>
              </td>
              <td class="text-center">
                <div class="modulos-indicator">
                   <span class="indicator-val">{{ e.modulos_usados }}</span>
                   <span class="indicator-sep">/</span>
                   <span class="indicator-total">{{ e.modulos_total }}</span>
                </div>
              </td>
              <td class="text-muted small">{{ e.ultimo_acceso_fmt || 'Sin acceso' }}</td>
            </tr>
            <tr *ngIf="empresas.length === 0">
              <td colspan="6" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                Sin datos disponibles para los filtros seleccionados
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
    .card-tabla { border: 1px solid #e2e8f0; border-radius: 8px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .tabla-header { background: #f8fafc; padding: 1rem 1.25rem; font-weight: 700; font-size: 0.9rem; color: #1e293b; border-bottom: 1px solid #e2e8f0; }
    .card-tabla .table-responsive { max-height: 575px; overflow-y: auto; overflow-x: auto; }
    .pagination-premium-container { background: #ffffff; border-top: 1px solid #e2e8f0; }
    .form-select-premium-sm { padding: 0.4rem 2rem 0.4rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 0.85rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
    .form-select-premium-sm:focus { border-color: #161d35; outline: none; }
    .btn-nav-premium { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; cursor: pointer; }
    .btn-nav-premium:hover:not(:disabled) { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
    .btn-nav-premium:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-indicator-premium { min-width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #161d35; color: white; font-weight: 700; font-size: 0.9rem; padding: 0 0.75rem; }
    .fw-600 { font-weight: 600; }
    .fw-500 { font-weight: 500; }
    
    th { background: #f8fafc; padding: 0.75rem 1rem; font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    tbody tr:hover td { background: #f1f5f9; }
    
    .progress-container { display: flex; align-items: center; gap: 0.5rem; width: 140px; }
    .progress-bar-stack { flex: 1; height: 0.5rem; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }
    .progress-text { font-size: 0.75rem; width: 45px; }
    
    .modulos-indicator { display: inline-flex; align-items: center; background: #eff6ff; color: #1e40af; padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: 700; font-size: 0.75rem; border: 1px solid #dbeafe; }
    .indicator-sep { margin: 0 2px; opacity: 0.5; font-weight: 400; }
    
    .bg-success { background-color: #10b981 !important; }
    .bg-warning { background-color: #f59e0b !important; }
    .bg-danger { background-color: #ef4444 !important; }
    .text-success { color: #059669 !important; }
    .text-warning { color: #d97706 !important; }
    .text-danger { color: #dc2626 !important; }
  `]
})
export class R033TablaComponent {
  private _empresas: any[] = [];

  @Input() set empresas(val: any[]) {
    this._empresas = val;
    this.currentPage = 1;
  }

  get empresas(): any[] {
    return this._empresas;
  }

  currentPage = 1;
  pageSize = 10;

  get paginatedEmpresas() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._empresas.slice(start, start + this.pageSize);
  }
  get totalPages() { return Math.ceil(this._empresas.length / this.pageSize) || 1; }
  get startItem() { return this._empresas.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get endItem() { return Math.min(this.currentPage * this.pageSize, this._empresas.length); }

  onPageSizeChange(event: Event) {
    this.pageSize = +(event.target as HTMLSelectElement).value;
    this.currentPage = 1;
  }

  getUsoClass(pct: number): string {
    if (pct >= 90) return 'bg-danger';
    if (pct >= 70) return 'bg-warning';
    return 'bg-success';
  }

  getUsoTextClass(pct: number): string {
    if (pct >= 90) return 'text-danger';
    if (pct >= 70) return 'text-warning';
    return 'text-success';
  }
}
