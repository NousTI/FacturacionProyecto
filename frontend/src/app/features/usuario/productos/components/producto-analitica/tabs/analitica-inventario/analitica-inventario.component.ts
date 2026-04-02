import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ProductosService } from '../../../../services/productos.service';
import { ProductoReporteInventario } from '../../../../../../../domain/models/producto.model';

@Component({
    selector: 'app-analitica-inventario',
    standalone: true,
    imports: [CommonModule, FormsModule],
    styleUrls: ['../../../../../clientes/components/cliente-analitica/tabs/shared-analitica.styles.css'],
    template: `
    <!-- Header + Filtro -->
    <div class="tab-header">
      <div>
        <h3 class="tab-title">Reporte de Inventario Actual</h3>
        <p class="tab-sub">Vista global de stock y alertas de reabastecimiento</p>
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
            <th class="text-right">Stock Min.</th>
            <th class="text-right">Stock Act.</th>
            <th class="text-center">Estado</th>
            <th class="text-right">Costo Unit.</th>
            <th class="text-right">Valor Inventario</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of productos">
            <td><span class="small fw-600 text-muted">{{ p.codigo }}</span></td>
            <td class="fw-600">{{ p.nombre }}</td>
            <td class="text-right text-muted">{{ p.stock_minimo }}</td>
            <td class="text-right fw-700">{{ p.stock_actual }}</td>
            <td class="text-center">
              <span class="badge-num" 
                    [ngClass]="{'green': p.estado_alerta==='OK', 'amber': p.estado_alerta==='BAJO'}"
                    [style.background]="p.estado_alerta==='CRITICO'? '#fef2f2' : ''"
                    [style.color]="p.estado_alerta==='CRITICO'? '#ef4444' : ''">
                {{ p.estado_alerta }}
              </span>
            </td>
            <td class="text-right">
                <span *ngIf="p.costo_unitario !== null">\${{ p.costo_unitario | number:'1.2-2' }}</span>
                <span *ngIf="p.costo_unitario === null" class="text-muted">—</span>
            </td>
            <td class="text-right">
                <span *ngIf="p.valor_total_inventario !== null" class="text-blue fw-600">\${{ p.valor_total_inventario | number:'1.2-2' }}</span>
                <span *ngIf="p.valor_total_inventario === null" class="text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="empty-state" *ngIf="!loading && productos.length === 0">No hay productos que manejen inventario.</div>
    `
})
export class AnaliticaInventarioComponent implements OnInit, OnDestroy {
    productos: ProductoReporteInventario[] = [];
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(private svc: ProductosService, private cdr: ChangeDetectorRef) {}

    ngOnInit() { this.load(); }
    ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

    load() {
        this.loading = true;
        this.svc.getReporteInventario()
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
