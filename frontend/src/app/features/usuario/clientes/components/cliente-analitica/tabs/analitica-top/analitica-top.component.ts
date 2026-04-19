import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ClientesService } from '../../../../services/clientes.service';
import { ReporteTopClientes } from '../../../../../../../domain/models/cliente.model';

@Component({
    selector: 'app-analitica-top',
    standalone: true,
    imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
    styleUrls: ['../../tabs/shared-analitica.styles.css'],
    styles: [`
    .rank-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 50%;
      font-size: 0.75rem; font-weight: 800;
      background: #f1f5f9; color: #334155;
    }
    .rank-badge.gold   { background: #fef3c7; color: #b45309; }
    .rank-badge.silver { background: #e2e8f0; color: #475569; }
    .rank-badge.bronze { background: #fef3c7; color: #c2410c; }
    .client-name    { font-weight: 600; color: var(--primary-color); }
    .client-contact { font-size: 0.7rem; color: #94a3b8; margin-top: 0.1rem; }
    `],
    template: `
    <div class="tab-header">
      <div>
        <h3 class="tab-title">Top Clientes</h3>
        <p class="tab-sub">Mejores compradores según {{ criterio === 'monto' ? 'monto total' : 'nº de facturas' }}</p>
      </div>
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Criterio</label>
          <select class="filter-select" [(ngModel)]="criterio" (change)="load()">
            <option value="monto">Monto Total</option>
            <option value="facturas">Nº Facturas</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Top</label>
          <select class="filter-select" [(ngModel)]="limit" (change)="load()">
            <option [value]="5">Top 5</option>
            <option [value]="10">Top 10</option>
            <option [value]="20">Top 20</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Desde</label>
          <input type="date" class="filter-select" [(ngModel)]="fechaInicio" (change)="load()">
        </div>
        <div class="filter-group">
          <label class="filter-label">Hasta</label>
          <input type="date" class="filter-select" [(ngModel)]="fechaFin" (change)="load()">
        </div>
      </div>
    </div>

    <div *ngIf="loading" class="loading-box">
      <div class="spinner"></div><span>Cargando...</span>
    </div>

    <div class="data-table-wrap" *ngIf="!loading && reporte && reporte.clientes.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th class="text-right">Facturas</th>
            <th class="text-right">Total Compras</th>
            <th class="text-right">Ticket Prom.</th>
            <th class="text-right">Última Compra</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of reporte.clientes">
            <td>
              <span class="rank-badge" [ngClass]="rankClass(c.ranking)">{{ c.ranking }}</span>
            </td>
            <td>
              <div class="client-name">{{ c.razon_social }}</div>
              <div class="client-contact" *ngIf="c.email">{{ c.email }}</div>
            </td>
            <td class="text-right fw-600">{{ c.total_facturas }}</td>
            <td class="text-right fw-700 text-blue">{{ c.total_compras | currency:'USD':'symbol':'1.2-2' }}</td>
            <td class="text-right">{{ c.ticket_promedio | currency:'USD':'symbol':'1.2-2' }}</td>
            <td class="text-right text-muted">
              {{ c.ultima_compra ? (c.ultima_compra | date:'dd/MM/yyyy') : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="empty-state" *ngIf="!loading && (!reporte || reporte.clientes.length === 0)">
      No hay datos para los filtros seleccionados.
    </div>
    `
})
export class AnaliticaTopComponent implements OnInit, OnDestroy {
    criterio: 'monto' | 'facturas' = 'monto';
    limit: 5 | 10 | 20 = 10;
    fechaInicio = '';
    fechaFin = '';
    reporte: ReporteTopClientes | null = null;
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(private svc: ClientesService, private cdr: ChangeDetectorRef) {}

    ngOnInit() { this.load(); }
    ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

    load() {
        this.loading = true;
        this.reporte = null;
        console.log(`[Top Clientes] Iniciando petición... Criterio: ${this.criterio}`);
        const startTime = Date.now();
        this.svc.getTopClientes({
            criterio: this.criterio,
            limit: this.limit,
            fechaInicio: this.fechaInicio || undefined,
            fechaFin:    this.fechaFin    || undefined,
        })
        .pipe(takeUntil(this.destroy$), finalize(() => {
            this.loading = false;
            console.log(`[Top Clientes] Petición finalizada en ${Date.now() - startTime}ms`);
            this.cdr.detectChanges();
        }))
        .subscribe({ 
            next: r => {
                console.log('[Top Clientes] Datos recibidos con éxito:', r.detalles);
                this.reporte = r.detalles ?? null;
                this.cdr.detectChanges();
            }, 
            error: err => {
                console.error('[Top Clientes] Error en la petición:', err);
                this.cdr.detectChanges();
            } 
        });
    }

    rankClass(rank: number) {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return '';
    }
}

