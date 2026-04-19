import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MisVentasReport } from '../../services/financial-reports.service';
import { RangoTipo } from '../../reportes.page';

@Component({
  selector: 'app-r001-mis-ventas',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, FormsModule],
  template: `
    <div class="fade-in">

      <!-- KPIs -->
      <div class="kpi-grid mb-4">

        <div class="kpi-card highlight">
          <span class="label">Total Vendido</span>
          <span class="value">{{ data.kpis.total_vendido.valor | currency }}</span>
          <span class="subtext">mis ventas</span>
          <span class="trend highlight-trend" [class.up]="data.kpis.total_vendido.variacion >= 0" [class.down]="data.kpis.total_vendido.variacion < 0">
            <i class="bi" [class.bi-arrow-up-short]="data.kpis.total_vendido.variacion >= 0" [class.bi-arrow-down-short]="data.kpis.total_vendido.variacion < 0"></i>
            {{ data.kpis.total_vendido.variacion | number:'1.1-1' }}% {{ labelPeriodoAnt }}
          </span>
        </div>

        <div class="kpi-card blue">
          <span class="label">Mis Facturas (período)</span>
          <span class="value">{{ data.kpis.mis_facturas.valor }}</span>
          <span class="subtext">emitidas por mí</span>
          <span class="trend" [class.up]="data.kpis.mis_facturas.variacion >= 0" [class.down]="data.kpis.mis_facturas.variacion < 0">
            <i class="bi" [class.bi-arrow-up-short]="data.kpis.mis_facturas.variacion >= 0" [class.bi-arrow-down-short]="data.kpis.mis_facturas.variacion < 0"></i>
            {{ data.kpis.mis_facturas.variacion | number:'1.1-1' }}% {{ labelPeriodoAnt }}
          </span>
        </div>

        <div class="kpi-card amber">
          <span class="label">Devoluciones</span>
          <span class="value">{{ data.kpis.devoluciones.valor }}</span>
          <span class="subtext">notas crédito emitidas</span>
          <ng-container *ngIf="data.kpis.devoluciones.variacion != null; else sinVariacion">
            <span class="trend" [class.up]="data.kpis.devoluciones.variacion <= 0" [class.down]="data.kpis.devoluciones.variacion > 0">
              <i class="bi" [class.bi-arrow-up-short]="data.kpis.devoluciones.variacion > 0" [class.bi-arrow-down-short]="data.kpis.devoluciones.variacion <= 0"></i>
              {{ data.kpis.devoluciones.variacion | number:'1.1-1' }}% {{ labelPeriodoAnt }}
            </span>
          </ng-container>
          <ng-template #sinVariacion>
            <span class="subtext">sin período anterior</span>
          </ng-template>
        </div>

        <div class="kpi-card indigo">
          <span class="label">Mi Ticket Promedio</span>
          <span class="value">{{ data.kpis.ticket_promedio.valor | currency }}</span>
          <span class="subtext">por factura</span>
          <span class="trend" [class.up]="data.kpis.ticket_promedio.variacion >= 0" [class.down]="data.kpis.ticket_promedio.variacion < 0">
            <i class="bi" [class.bi-arrow-up-short]="data.kpis.ticket_promedio.variacion >= 0" [class.bi-arrow-down-short]="data.kpis.ticket_promedio.variacion < 0"></i>
            {{ data.kpis.ticket_promedio.variacion | number:'1.1-1' }}% {{ labelPeriodoAnt }}
          </span>
        </div>

      </div>

      <div class="row g-4">

        <!-- Facturas Recientes -->
        <div class="col-lg-6">
          <div class="section-card-table h-100">
            <div class="section-header px-4 pt-4">
              <h5><i class="bi bi-receipt me-2"></i>Mis Facturas Recientes</h5>
              <p>Últimas facturas emitidas en el período</p>
            </div>
            <div class="tabla-scroll">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>N° Factura</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th class="text-end">Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let f of paginatedFacturas" class="hover-row">
                    <td class="font-mono">{{ f.numero_factura }}</td>
                    <td class="font-medium">{{ f.cliente }}</td>
                    <td class="text-muted-sm">{{ f.fecha }}</td>
                    <td class="text-end font-bold">{{ f.total | currency }}</td>
                    <td>
                      <span class="estado-badge" [ngClass]="{
                        'autorizada': f.estado === 'AUTORIZADA',
                        'anulada':    f.estado === 'ANULADA',
                        'pendiente':  f.estado !== 'AUTORIZADA' && f.estado !== 'ANULADA'
                      }">{{ f.estado }}</span>
                    </td>
                  </tr>
                  <tr *ngIf="!data.facturas_recientes.length">
                    <td colspan="5" class="text-center py-4 text-muted">Sin facturas en el período seleccionado</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination-premium-container">
              <div class="d-flex align-items-center justify-content-between px-4 py-3">
                <div class="d-flex align-items-center gap-3">
                  <span class="pag-label">Por página:</span>
                  <select class="form-select-premium-sm" [(ngModel)]="pageSizeF" (change)="onPageSizeFChange($event)">
                    <option [value]="10">10</option>
                    <option [value]="25">25</option>
                    <option [value]="50">50</option>
                    <option [value]="100">100</option>
                  </select>
                </div>
                <span class="pag-info"><strong>{{ startItemF }} - {{ endItemF }}</strong> de <strong>{{ data.facturas_recientes.length }}</strong></span>
                <div class="d-flex align-items-center gap-2">
                  <button class="btn-nav-premium" [disabled]="pageF === 1" (click)="pageF = pageF - 1"><i class="bi bi-chevron-left"></i></button>
                  <div class="page-indicator-premium">{{ pageF }}</div>
                  <button class="btn-nav-premium" [disabled]="pageF === totalPagesF" (click)="pageF = pageF + 1"><i class="bi bi-chevron-right"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mis Clientes -->
        <div class="col-lg-6">
          <div class="section-card-table h-100">
            <div class="section-header px-4 pt-4">
              <h5><i class="bi bi-people me-2"></i>Mis Clientes Activos</h5>
              <p>Clientes a los que has facturado en el período</p>
            </div>
            <div class="tabla-scroll">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th class="text-center">Facturas</th>
                    <th class="text-end">Total Compras</th>
                    <th>Última Compra</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of paginatedClientes" class="hover-row">
                    <td class="font-medium">{{ c.cliente }}</td>
                    <td class="text-center">{{ c.facturas }}</td>
                    <td class="text-end font-bold">{{ c.total_compras | currency }}</td>
                    <td class="text-muted-sm">{{ c.ultima_compra }}</td>
                    <td>
                      <span class="estado-badge" [ngClass]="{
                        'autorizada': c.estado === 'Activo',
                        'anulada':    c.estado === 'Inactivo'
                      }">{{ c.estado }}</span>
                    </td>
                  </tr>
                  <tr *ngIf="!data.mis_clientes.length">
                    <td colspan="5" class="text-center py-4 text-muted">Sin clientes en el período seleccionado</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination-premium-container">
              <div class="d-flex align-items-center justify-content-between px-4 py-3">
                <div class="d-flex align-items-center gap-3">
                  <span class="pag-label">Por página:</span>
                  <select class="form-select-premium-sm" [(ngModel)]="pageSizeC" (change)="onPageSizeCChange($event)">
                    <option [value]="10">10</option>
                    <option [value]="25">25</option>
                    <option [value]="50">50</option>
                    <option [value]="100">100</option>
                  </select>
                </div>
                <span class="pag-info"><strong>{{ startItemC }} - {{ endItemC }}</strong> de <strong>{{ data.mis_clientes.length }}</strong></span>
                <div class="d-flex align-items-center gap-2">
                  <button class="btn-nav-premium" [disabled]="pageC === 1" (click)="pageC = pageC - 1"><i class="bi bi-chevron-left"></i></button>
                  <div class="page-indicator-premium">{{ pageC }}</div>
                  <button class="btn-nav-premium" [disabled]="pageC === totalPagesC" (click)="pageC = pageC + 1"><i class="bi bi-chevron-right"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* KPIs */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .kpi-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 12px;
      padding: 0.85rem 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      display: flex; flex-direction: column; gap: 0.3rem; min-height: 95px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #e2e8f0; }
    .kpi-card.highlight {
      background: var(--gradient-highlight); border-color: transparent;
      box-shadow: 0 4px 18px rgba(168,85,247,0.35);
    }
    .kpi-card.highlight .label   { color: rgba(255,255,255,0.8); }
    .kpi-card.highlight .value   { color: #fff; }
    .kpi-card.highlight .subtext { color: rgba(255,255,255,0.75); }
    .highlight-trend { color: rgba(255,255,255,0.9) !important; }

    .label   { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .value   { font-size: 1.65rem; font-weight: 800; color: var(--primary-color); line-height: 1.1; }
    .subtext { font-size: 0.72rem; color: #94a3b8; }
    .trend   { font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; gap: 1px; }
    .trend.up   { color: #10b981; }
    .trend.down { color: #ef4444; }

    /* Cards */
    .section-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 20px;
      padding: 1.75rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .section-card-table {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 20px;
      overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      display: flex; flex-direction: column;
    }
    .section-header h5 { font-weight: 800; color: var(--primary-color); margin-bottom: 0.2rem; font-size: 1rem; }
    .section-header p  { font-size: 0.8rem; color: #64748b; margin-bottom: 1.25rem; }
    .tabla-scroll { max-height: 530px; overflow-y: auto; overflow-x: auto; }
    .pagination-premium-container { background: #fff; border-top: 1px solid #f1f5f9; }
    .pag-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; white-space: nowrap; }
    .pag-info  { font-size: 0.82rem; color: #64748b; }
    .form-select-premium-sm { padding: 0.35rem 1.75rem 0.35rem 0.75rem; border-radius: 10px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 0.82rem; font-weight: 600; color: #475569; cursor: pointer; }
    .btn-nav-premium { width: 34px; height: 34px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-nav-premium:hover:not(:disabled) { background: #f8fafc; color: var(--primary-color); border-color: #cbd5e1; }
    .btn-nav-premium:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-indicator-premium { min-width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--primary-color); color: white; font-weight: 700; font-size: 0.85rem; padding: 0 0.6rem; }

    /* Tabla */
    .modern-table thead th {
      background: #f8fafc; border: none; font-size: 0.68rem;
      text-transform: uppercase; color: #64748b; padding: 0.85rem 1rem; font-weight: 700;
      position: sticky; top: 0; z-index: 1;
    }
    .modern-table tbody td { border-bottom: 1px solid #f1f5f9; padding: 0.9rem 1rem; vertical-align: middle; font-size: 0.88rem; }
    .hover-row:hover { background: #f8fafc; }
    .font-medium  { font-weight: 600; color: #334155; }
    .font-bold    { font-weight: 800; color: var(--primary-color); }
    .font-mono    { font-family: monospace; font-size: 0.82rem; color: #334155; }
    .text-muted-sm { font-size: 0.82rem; color: #94a3b8; }

    /* Estados */
    .estado-badge {
      display: inline-block; padding: 0.3rem 0.7rem; border-radius: 8px;
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .estado-badge.autorizada { background: #f0fdf4; color: #166534; }
    .estado-badge.anulada    { background: #fef2f2; color: #991b1b; }
    .estado-badge.pendiente  { background: #fffbeb; color: #854d0e; }
  `]
})
export class R001MisVentasComponent implements OnChanges {
  @Input() data!: MisVentasReport;
  @Input() rangoTipo: RangoTipo = 'mes_actual';

  // Paginación facturas
  pageF = 1; pageSizeF = 10;
  get paginatedFacturas() { const s = (this.pageF - 1) * this.pageSizeF; return this.data?.facturas_recientes?.slice(s, s + this.pageSizeF) || []; }
  get totalPagesF() { return Math.ceil((this.data?.facturas_recientes?.length || 0) / this.pageSizeF) || 1; }
  get startItemF() { return this.data?.facturas_recientes?.length ? (this.pageF - 1) * this.pageSizeF + 1 : 0; }
  get endItemF() { return Math.min(this.pageF * this.pageSizeF, this.data?.facturas_recientes?.length || 0); }
  onPageSizeFChange(e: Event) { this.pageSizeF = +(e.target as HTMLSelectElement).value; this.pageF = 1; }

  // Paginación clientes
  pageC = 1; pageSizeC = 10;
  get paginatedClientes() { const s = (this.pageC - 1) * this.pageSizeC; return this.data?.mis_clientes?.slice(s, s + this.pageSizeC) || []; }
  get totalPagesC() { return Math.ceil((this.data?.mis_clientes?.length || 0) / this.pageSizeC) || 1; }
  get startItemC() { return this.data?.mis_clientes?.length ? (this.pageC - 1) * this.pageSizeC + 1 : 0; }
  get endItemC() { return Math.min(this.pageC * this.pageSizeC, this.data?.mis_clientes?.length || 0); }
  onPageSizeCChange(e: Event) { this.pageSizeC = +(e.target as HTMLSelectElement).value; this.pageC = 1; }

  get labelPeriodoAnt(): string {
    switch (this.rangoTipo) {
      case 'mes_actual':       return 'vs mes anterior';
      case 'mes_anterior':     return 'vs mes previo';
      case 'anio_actual':      return 'vs año anterior';
      case 'semestre_1':       return 'vs semestre anterior';
      case 'semestre_2':       return 'vs semestre anterior';
      case 'personalizado':    return 'vs período anterior';
      case 'personalizado_mes':return 'vs mes anterior';
      default:                 return '{{ labelPeriodoAnt }}';
    }
  }

  ngOnChanges() { this.pageF = 1; this.pageC = 1; }
}

