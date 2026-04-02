import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ProductosService } from '../../../../services/productos.service';
import { ProductoMasVendido } from '../../../../../../../domain/models/producto.model';

@Component({
    selector: 'app-analitica-mas-vendidos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    styleUrls: ['../../../../../clientes/components/cliente-analitica/tabs/shared-analitica.styles.css'],
    template: `
    <!-- Header + Filtro -->
    <div class="tab-header">
      <div>
        <h3 class="tab-title">Productos Más Vendidos</h3>
        <p class="tab-sub">Ranking según volumen o cantidad</p>
      </div>
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Criterio</label>
          <select class="filter-select" [(ngModel)]="criterio" (change)="load()">
            <option value="cantidad">Por Cantidad</option>
            <option value="monto">Por Monto Vendido</option>
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
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="loading-box">
      <div class="spinner"></div><span>Cargando...</span>
    </div>

    <div class="data-table-wrap" *ngIf="!loading && productos.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>Ranking</th>
            <th>Código</th>
            <th>Producto</th>
            <th class="text-right">Cantidad</th>
            <th class="text-right">Total Vendido</th>
            <th class="text-right">Utilidad</th>
            <th class="text-right">Margen</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of productos; let i = index">
            <td><span class="badge-num" [ngClass]="{'blue': i < 3, 'amber': i >= 3}">#{{ i + 1 }}</span></td>
            <td><span class="small fw-600 text-muted">{{ p.codigo }}</span></td>
            <td class="fw-600">{{ p.nombre }}</td>
            <td class="text-right"><span class="badge-num blue">{{ p.cantidad_vendida }}</span></td>
            <td class="text-right fw-700 text-blue">\${{ p.total_vendido | number:'1.2-2' }}</td>
            <td class="text-right">
              <span *ngIf="p.utilidad !== null" class="fw-600">\${{ p.utilidad | number:'1.2-2' }}</span>
              <span *ngIf="p.utilidad === null" class="text-muted">—</span>
            </td>
            <td class="text-right">
              <span *ngIf="p.margen !== null" class="badge-num green">{{ p.margen | number:'1.1-1' }}%</span>
              <span *ngIf="p.margen === null" class="text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="empty-state" *ngIf="!loading && productos.length === 0">No hay productos vendidos en este período o no cumplan los criterios.</div>
    `
})
export class AnaliticaMasVendidosComponent implements OnInit, OnDestroy {
    criterio: 'cantidad' | 'monto' = 'cantidad';
    limit = 10;
    productos: ProductoMasVendido[] = [];
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(private svc: ProductosService, private cdr: ChangeDetectorRef) {}

    ngOnInit() { this.load(); }
    ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

    load() {
        this.loading = true;
        this.svc.getProductosMasVendidos(this.limit, this.criterio)
            .pipe(takeUntil(this.destroy$), finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            }))
            .subscribe({ 
                next: r => { this.productos = r.detalles || []; }, 
                error: () => {} 
            });
    }
}
