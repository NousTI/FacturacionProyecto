import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ClientesService } from '../../../../services/clientes.service';
import { ReporteClientesInactivos } from '../../../../../../../domain/models/cliente.model';

@Component({
    selector: 'app-analitica-inactivos',
    standalone: true,
    imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
    styleUrls: ['../../tabs/shared-analitica.styles.css'],
    styles: [`
    .inactivity-badge {
      display: inline-block;
      padding: 0.2rem 0.65rem; border-radius: 50px;
      font-size: 0.73rem; font-weight: 700;
    }
    .inactivity-badge.low  { background: #fffbeb; color: #f59e0b; }
    .inactivity-badge.mid  { background: #fff7ed; color: #ea580c; }
    .inactivity-badge.high { background: #fef2f2; color: #dc2626; }
    `],
    template: `
    <div class="tab-header">
      <div>
        <h3 class="tab-title">Clientes Inactivos</h3>
        <p class="tab-sub">Sin facturas en los últimos <strong>{{ dias }}</strong> días</p>
      </div>
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Días sin compra</label>
          <select class="filter-select" [(ngModel)]="dias" (change)="load()">
            <option [value]="30">30 días</option>
            <option [value]="60">60 días</option>
            <option [value]="90">90 días</option>
            <option [value]="180">180 días</option>
            <option [value]="365">1 año</option>
          </select>
        </div>
      </div>
    </div>

    <div *ngIf="loading" class="loading-box">
      <div class="spinner"></div><span>Cargando...</span>
    </div>

    <ng-container *ngIf="!loading && reporte">
      <div class="mini-stats">
        <div class="mini-card red">
          <span class="mini-val">{{ reporte.total_inactivos }}</span>
          <span class="mini-lbl">Total Inactivos</span>
        </div>
        <div class="mini-card amber">
          <span class="mini-val">{{ reporte.total_sin_compras_historicas }}</span>
          <span class="mini-lbl">Nunca Compraron</span>
        </div>
      </div>

      <div class="data-table-wrap" *ngIf="reporte.clientes.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th class="text-right">Última Factura</th>
              <th class="text-right">Días Sin Comprar</th>
              <th class="text-right">Total Histórico</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of reporte.clientes">
              <td class="fw-600">{{ c.razon_social }}</td>
              <td class="text-muted small">
                <div *ngIf="c.email">{{ c.email }}</div>
                <div *ngIf="c.telefono">{{ c.telefono }}</div>
                <span *ngIf="!c.email && !c.telefono">—</span>
              </td>
              <td class="text-right text-muted">
                {{ c.ultima_factura ? (c.ultima_factura | date:'dd/MM/yyyy') : 'Nunca' }}
              </td>
              <td class="text-right">
                <span class="inactivity-badge" [ngClass]="inactivityClass(c.dias_sin_comprar)">
                  {{ c.dias_sin_comprar }} días
                </span>
              </td>
              <td class="text-right fw-600">
                {{ c.total_historico | currency:'USD':'symbol':'1.2-2' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state" *ngIf="reporte.clientes.length === 0">
        ¡Excelente! No hay clientes inactivos en este período.
      </div>
    </ng-container>
    `
})
export class AnaliticaInactivosComponent implements OnInit, OnDestroy {
    dias = 90;
    reporte: ReporteClientesInactivos | null = null;
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(private svc: ClientesService, private cdr: ChangeDetectorRef) {}

    ngOnInit() { this.load(); }
    ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

    load() {
        this.loading = true;
        this.reporte = null;
        this.svc.getClientesInactivos(this.dias)
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

    inactivityClass(dias: number) {
        if (dias < 90)  return 'low';
        if (dias < 180) return 'mid';
        return 'high';
    }
}
