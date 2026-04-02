import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ClientesService } from '../../../../services/clientes.service';
import { ReporteNuevosClientes } from '../../../../../../../domain/models/cliente.model';

@Component({
    selector: 'app-analitica-nuevos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    styleUrls: ['../../tabs/shared-analitica.styles.css'],
    template: `
    <!-- Header + Filtro -->
    <div class="tab-header">
      <div>
        <h3 class="tab-title">Clientes Nuevos por Mes</h3>
        <p class="tab-sub">Clientes registrados en los últimos <strong>{{ meses }}</strong> meses</p>
      </div>
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Períodos</label>
          <select class="filter-select" [(ngModel)]="meses" (change)="load()">
            <option [value]="3">3 meses</option>
            <option [value]="6">6 meses</option>
            <option [value]="12">12 meses</option>
            <option [value]="24">24 meses</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="loading-box">
      <div class="spinner"></div><span>Cargando...</span>
    </div>

    <ng-container *ngIf="!loading && reporte">
      <!-- Mini stats -->
      <div class="mini-stats">
        <div class="mini-card blue">
          <span class="mini-val">{{ reporte.total_nuevos }}</span>
          <span class="mini-lbl">Total Nuevos</span>
        </div>
        <div class="mini-card green">
          <span class="mini-val">{{ reporte.total_con_compra }}</span>
          <span class="mini-lbl">Con Primera Compra</span>
        </div>
        <div class="mini-card amber">
          <span class="mini-val">{{ reporte.total_sin_compra }}</span>
          <span class="mini-lbl">Sin Compras Aún</span>
        </div>
      </div>

      <!-- Tabla -->
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th class="text-right">Nuevos</th>
              <th class="text-right">1ª Compra</th>
              <th class="text-right">Sin Compras</th>
              <th class="text-right">Conversión</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of reporte.periodos">
              <td class="fw-600">{{ p.mes }}</td>
              <td class="text-right"><span class="badge-num blue">{{ p.nuevos_clientes }}</span></td>
              <td class="text-right"><span class="badge-num green">{{ p.con_primera_compra }}</span></td>
              <td class="text-right"><span class="badge-num amber">{{ p.sin_compras }}</span></td>
              <td class="text-right fw-600">
                {{ p.nuevos_clientes > 0
                    ? ((p.con_primera_compra / p.nuevos_clientes) * 100).toFixed(0) + '%'
                    : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <div class="empty-state" *ngIf="!loading && !reporte">No hay datos disponibles.</div>
    `
})
export class AnaliticaNuevosComponent implements OnInit, OnDestroy {
    meses = 6;
    reporte: ReporteNuevosClientes | null = null;
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(private svc: ClientesService, private cdr: ChangeDetectorRef) {}

    ngOnInit() { this.load(); }
    ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

    load() {
        this.loading = true;
        this.reporte = null;
        this.svc.getNuevosPorMes(this.meses)
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
