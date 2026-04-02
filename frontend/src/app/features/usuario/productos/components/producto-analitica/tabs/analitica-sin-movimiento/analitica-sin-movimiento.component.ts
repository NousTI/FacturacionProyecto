import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ProductosService } from '../../../../services/productos.service';
import { ProductoSinMovimiento } from '../../../../../../../domain/models/producto.model';

@Component({
    selector: 'app-analitica-sin-movimiento',
    standalone: true,
    imports: [CommonModule, FormsModule],
    styleUrls: ['../../../../../clientes/components/cliente-analitica/tabs/shared-analitica.styles.css'],
    template: `
    <!-- Header + Filtro -->
    <div class="tab-header">
      <div>
        <h3 class="tab-title">Productos Sin Movimiento</h3>
        <p class="tab-sub">Productos con stock que no han registrado ventas en facturas</p>
      </div>
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Días Inactividad</label>
          <select class="filter-select" [(ngModel)]="dias" (change)="load()">
            <option [value]="30">30 días</option>
            <option [value]="60">60 días</option>
            <option [value]="90">90 días</option>
            <option [value]="180">6 meses</option>
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
            <th>Código</th>
            <th>Producto</th>
            <th>Última Venta</th>
            <th class="text-right">Días Sin Venta</th>
            <th class="text-right">Stock Actual</th>
            <th class="text-right">Costo Inv.</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of productos">
            <td><span class="small fw-600 text-muted">{{ p.codigo }}</span></td>
            <td class="fw-600">{{ p.nombre }}</td>
            <td>
               <span *ngIf="p.ultima_venta">{{ p.ultima_venta | date:'MMM d, y' }}</span>
               <span *ngIf="!p.ultima_venta" class="badge-num amber">Nunca vendido</span>
            </td>
            <td class="text-right">
                <span class="badge-num red" style="background:#fef2f2;color:#ef4444">{{ p.dias_sin_movimiento || '∞' }}</span>
            </td>
            <td class="text-right fw-600">{{ p.stock_actual }}</td>
            <td class="text-right">
                <span *ngIf="p.costo !== null">\${{ p.costo * p.stock_actual | number:'1.2-2' }}</span>
                <span *ngIf="p.costo === null" class="text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="empty-state" *ngIf="!loading && productos.length === 0">No hay productos sin movimiento en el período seleccionado.</div>
    `
})
export class AnaliticaSinMovimientoComponent implements OnInit, OnDestroy {
    dias = 30;
    productos: ProductoSinMovimiento[] = [];
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(private svc: ProductosService, private cdr: ChangeDetectorRef) {}

    ngOnInit() { this.load(); }
    ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

    load() {
        this.loading = true;
        this.svc.getProductosSinMovimiento(this.dias)
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
