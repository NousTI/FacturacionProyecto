import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MisVentasReport } from '../../services/financial-reports.service';

@Component({
  selector: 'app-r001-mis-ventas',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="fade-in">

      <!-- Banner informativo -->
      <div class="info-banner mb-4">
        <i class="bi bi-info-circle-fill me-2"></i>
        <span>
          <strong>Filtro aplicado automáticamente por el sistema:</strong>
          mostrando únicamente las facturas emitidas por <strong>{{ data.empleado }}</strong>.
          Solo puedes ver tus propias ventas.
        </span>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid mb-4">

        <div class="kpi-card blue">
          <span class="label">Mis Facturas (período)</span>
          <span class="value">{{ data.kpis.mis_facturas.valor }}</span>
          <span class="subtext">emitidas por mí</span>
          <span class="trend" [class.up]="data.kpis.mis_facturas.variacion >= 0" [class.down]="data.kpis.mis_facturas.variacion < 0">
            <i class="bi" [class.bi-arrow-up-short]="data.kpis.mis_facturas.variacion >= 0" [class.bi-arrow-down-short]="data.kpis.mis_facturas.variacion < 0"></i>
            {{ data.kpis.mis_facturas.variacion | number:'1.1-1' }}% vs período ant.
          </span>
        </div>

        <div class="kpi-card teal">
          <span class="label">Total Vendido</span>
          <span class="value">{{ data.kpis.total_vendido.valor | currency }}</span>
          <span class="subtext">mis ventas</span>
          <span class="trend" [class.up]="data.kpis.total_vendido.variacion >= 0" [class.down]="data.kpis.total_vendido.variacion < 0">
            <i class="bi" [class.bi-arrow-up-short]="data.kpis.total_vendido.variacion >= 0" [class.bi-arrow-down-short]="data.kpis.total_vendido.variacion < 0"></i>
            {{ data.kpis.total_vendido.variacion | number:'1.1-1' }}% vs período ant.
          </span>
        </div>

        <div class="kpi-card amber">
          <span class="label">Devoluciones</span>
          <span class="value">{{ data.kpis.devoluciones.valor }}</span>
          <span class="subtext">notas crédito emitidas</span>
          <span class="trend" [class.up]="data.kpis.devoluciones.variacion <= 0" [class.down]="data.kpis.devoluciones.variacion > 0">
            <i class="bi" [class.bi-arrow-up-short]="data.kpis.devoluciones.variacion >= 0" [class.bi-arrow-down-short]="data.kpis.devoluciones.variacion < 0"></i>
            {{ data.kpis.devoluciones.variacion | number:'1.1-1' }}% vs período ant.
          </span>
        </div>

        <div class="kpi-card indigo">
          <span class="label">Mi Ticket Promedio</span>
          <span class="value">{{ data.kpis.ticket_promedio.valor | currency }}</span>
          <span class="subtext">por factura</span>
          <span class="trend" [class.up]="data.kpis.ticket_promedio.variacion >= 0" [class.down]="data.kpis.ticket_promedio.variacion < 0">
            <i class="bi" [class.bi-arrow-up-short]="data.kpis.ticket_promedio.variacion >= 0" [class.bi-arrow-down-short]="data.kpis.ticket_promedio.variacion < 0"></i>
            {{ data.kpis.ticket_promedio.variacion | number:'1.1-1' }}% vs período ant.
          </span>
        </div>

      </div>

      <div class="row g-4">

        <!-- Facturas Recientes -->
        <div class="col-lg-6">
          <div class="section-card h-100">
            <div class="section-header">
              <h5><i class="bi bi-receipt me-2"></i>Mis Facturas Recientes</h5>
              <p>Últimas 10 facturas emitidas en el período</p>
            </div>
            <div class="table-responsive">
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
                  <tr *ngFor="let f of data.facturas_recientes" class="hover-row">
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
          </div>
        </div>

        <!-- Mis Clientes -->
        <div class="col-lg-6">
          <div class="section-card h-100">
            <div class="section-header">
              <h5><i class="bi bi-people me-2"></i>Mis Clientes Activos</h5>
              <p>Clientes a los que has facturado en el período</p>
            </div>
            <div class="table-responsive">
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
                  <tr *ngFor="let c of data.mis_clientes" class="hover-row">
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
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Banner */
    .info-banner {
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px;
      padding: 0.85rem 1.25rem; font-size: 0.85rem; color: #1e40af;
      display: flex; align-items: flex-start; gap: 0.25rem;
    }
    .info-banner i { font-size: 1rem; margin-top: 1px; flex-shrink: 0; }

    /* KPIs */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
    .kpi-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 20px;
      padding: 1.4rem 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .kpi-card.blue   { border-top: 4px solid #3b82f6; }
    .kpi-card.teal   { border-top: 4px solid #14b8a6; }
    .kpi-card.amber  { border-top: 4px solid #f59e0b; }
    .kpi-card.indigo { border-top: 4px solid #6366f1; }

    .label   { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .value   { font-size: 1.65rem; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .subtext { font-size: 0.72rem; color: #94a3b8; }
    .trend   { font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; gap: 1px; }
    .trend.up   { color: #10b981; }
    .trend.down { color: #ef4444; }

    /* Cards */
    .section-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 20px;
      padding: 1.75rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .section-header h5 { font-weight: 800; color: #1e293b; margin-bottom: 0.2rem; font-size: 1rem; }
    .section-header p  { font-size: 0.8rem; color: #64748b; margin-bottom: 1.25rem; }

    /* Tabla */
    .modern-table thead th {
      background: #f8fafc; border: none; font-size: 0.68rem;
      text-transform: uppercase; color: #64748b; padding: 0.85rem 1rem; font-weight: 700;
    }
    .modern-table tbody td { border-bottom: 1px solid #f1f5f9; padding: 0.9rem 1rem; vertical-align: middle; font-size: 0.88rem; }
    .hover-row:hover { background: #f8fafc; }
    .font-medium  { font-weight: 600; color: #334155; }
    .font-bold    { font-weight: 800; color: #1e293b; }
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

  ngOnChanges() {}
}
