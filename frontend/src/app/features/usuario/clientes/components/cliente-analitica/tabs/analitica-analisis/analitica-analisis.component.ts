import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ClientesService } from '../../../../services/clientes.service';
import { ReporteAnalisisClientes } from '../../../../../../../domain/models/cliente.model';

@Component({
    selector: 'app-analitica-analisis',
    standalone: true,
    imports: [CommonModule, FormsModule, CurrencyPipe],
    styleUrls: ['../../tabs/shared-analitica.styles.css'],
    styles: [`
    .analisis-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 900px) { .analisis-grid { grid-template-columns: 1fr; } }

    .analisis-card {
      background: #fafbfc;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      padding: 1.25rem;
    }
    .card-subtitle {
      font-size: 0.85rem; font-weight: 800;
      color: #1e293b; margin: 0 0 1rem;
    }
    .pareto-note { font-size: 0.78rem; color: #64748b; margin: 0 0 1rem; }
    .pareto-table { max-height: 320px; overflow-y: auto; }

    /* Segmentos */
    .segment-list { display: flex; flex-direction: column; gap: 1rem; }
    .segment-row  { display: flex; flex-direction: column; gap: 0.4rem; }
    .seg-header   { display: flex; align-items: center; gap: 0.6rem; }
    .seg-desc     { font-size: 0.72rem; color: #94a3b8; }

    .seg-badge {
      display: inline-block; padding: 0.18rem 0.6rem; border-radius: 6px;
      font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .seg-badge.frecuentes  { background: #eff6ff; color: #2563eb; }
    .seg-badge.regulares   { background: #ecfdf5; color: #059669; }
    .seg-badge.ocasionales { background: #fffbeb; color: #d97706; }
    .seg-badge.nuevos      { background: #fdf2f8; color: #db2777; }
    .seg-badge.inactivos   { background: #fef2f2; color: #dc2626; }

    .seg-bar-wrap {
      height: 6px; background: #f1f5f9;
      border-radius: 100px; overflow: hidden;
    }
    .seg-bar {
      height: 100%; border-radius: 100px; transition: width 0.6s ease;
    }
    .seg-bar.frecuentes  { background: #3b82f6; }
    .seg-bar.regulares   { background: #10b981; }
    .seg-bar.ocasionales { background: #f59e0b; }
    .seg-bar.nuevos      { background: #ec4899; }
    .seg-bar.inactivos   { background: #ef4444; }

    .seg-metrics {
      display: flex; gap: 1rem;
      font-size: 0.73rem; color: #64748b; flex-wrap: wrap;
    }

    /* Pareto progress */
    .progress-wrap {
      position: relative; height: 18px;
      background: #f1f5f9; border-radius: 100px;
      overflow: hidden; min-width: 80px;
    }
    .progress-bar {
      position: absolute; top: 0; left: 0; height: 100%;
      background: linear-gradient(90deg, #3b82f6, #6366f1);
      border-radius: 100px; transition: width 0.5s ease;
    }
    .progress-label {
      position: absolute; right: 6px; top: 50%;
      transform: translateY(-50%);
      font-size: 0.65rem; font-weight: 700; color: #334155;
    }
    `],
    template: `
    <div class="tab-header">
      <div>
        <h3 class="tab-title">Análisis de Clientes</h3>
        <p class="tab-sub">Segmentación y Pareto 80/20 — últimos {{ periodoMeses }} mes(es)</p>
      </div>
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Período</label>
          <select class="filter-select" [(ngModel)]="periodoMeses" (change)="load()">
            <option [value]="1">1 mes</option>
            <option [value]="3">3 meses</option>
            <option [value]="6">6 meses</option>
            <option [value]="12">12 meses</option>
          </select>
        </div>
      </div>
    </div>

    <div *ngIf="loading" class="loading-box">
      <div class="spinner"></div><span>Cargando...</span>
    </div>

    <div class="analisis-grid" *ngIf="!loading && reporte">

      <!-- Segmentación -->
      <div class="analisis-card">
        <h4 class="card-subtitle">Segmentación de Cartera</h4>
        <div class="segment-list">
          <div *ngFor="let seg of reporte.segmentos" class="segment-row">
            <div class="seg-header">
              <span class="seg-badge" [ngClass]="seg.nombre.toLowerCase()">{{ seg.nombre }}</span>
              <span class="seg-desc">{{ seg.descripcion }}</span>
            </div>
            <div class="seg-bar-wrap">
              <div class="seg-bar" [ngClass]="seg.nombre.toLowerCase()"
                   [style.width.%]="seg.porcentaje_monto"></div>
            </div>
            <div class="seg-metrics">
              <span><strong>{{ seg.total_clientes }}</strong> clientes</span>
              <span><strong>{{ seg.porcentaje_clientes }}%</strong> del total</span>
              <span class="text-blue">
                <strong>{{ seg.monto_total | currency:'USD':'symbol':'1.0-0' }}</strong>
              </span>
              <span><strong>{{ seg.porcentaje_monto }}%</strong> ventas</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pareto 80/20 -->
      <div class="analisis-card">
        <h4 class="card-subtitle">Análisis Pareto 80/20</h4>
        <p class="pareto-note">
          {{ reporte.pareto.length }} cliente(s) generan el <strong>80%</strong>
          de tus ventas (de {{ reporte.total_clientes_analizados }} totales)
        </p>
        <div class="data-table-wrap pareto-table">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th class="text-right">Total</th>
                <th class="text-right">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of reporte.pareto">
                <td class="fw-600">{{ p.cliente_razon_social }}</td>
                <td class="text-right text-blue fw-600">
                  {{ p.total_compras | currency:'USD':'symbol':'1.2-2' }}
                </td>
                <td class="text-right">
                  <div class="progress-wrap">
                    <div class="progress-bar" [style.width.%]="p.porcentaje_acumulado"></div>
                    <span class="progress-label">{{ p.porcentaje_acumulado }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <div class="empty-state" *ngIf="!loading && !reporte">No hay datos disponibles.</div>
    `
})
export class AnaliticaAnalisisComponent implements OnInit, OnDestroy {
    periodoMeses = 3;
    reporte: ReporteAnalisisClientes | null = null;
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(private svc: ClientesService, private cdr: ChangeDetectorRef) {}

    ngOnInit() { this.load(); }
    ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

    load() {
        this.loading = true;
        this.reporte = null;
        this.svc.getAnalisisClientes(this.periodoMeses)
            .pipe(takeUntil(this.destroy$), finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            }))
            .subscribe({ 
                next: r => {
                    this.reporte = r.detalles ?? null;
                    this.cdr.detectChanges();
                }, 
                error: () => {
                    this.cdr.detectChanges();
                } 
            });
    }
}
