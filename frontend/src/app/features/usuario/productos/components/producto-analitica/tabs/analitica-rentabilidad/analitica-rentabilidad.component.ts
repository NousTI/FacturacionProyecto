import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ProductosService } from '../../../../services/productos.service';
import { ProductoRentabilidad } from '../../../../../../../domain/models/producto.model';

@Component({
    selector: 'app-analitica-rentabilidad',
    standalone: true,
    imports: [CommonModule, FormsModule],
    styleUrls: ['../../../../../clientes/components/cliente-analitica/tabs/shared-analitica.styles.css'],
    template: `
    <!-- Header + Filtro -->
    <div class="tab-header">
      <div>
        <h3 class="tab-title">Análisis de Rentabilidad</h3>
        <p class="tab-sub">Márgenes y utilidad general de los productos</p>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="loading-box">
      <div class="spinner"></div><span>Cargando...</span>
    </div>
    
    <div *ngIf="error" class="empty-state">
       <span class="text-muted"><i class="bi bi-shield-lock"></i> No tienes permisos para visualizar márgenes y costos.</span>
    </div>

    <div class="data-table-wrap" *ngIf="!loading && !error && productos.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th class="text-right">Precio</th>
            <th class="text-right">Costo</th>
            <th class="text-right">Utilidad Un.</th>
            <th class="text-right">Margen</th>
            <th class="text-right">Cant. Vendida</th>
            <th class="text-right">Útil. Total</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of productos">
            <td><span class="small fw-600 text-muted">{{ p.codigo }}</span></td>
            <td class="fw-600">{{ p.nombre }}</td>
            <td class="text-right text-blue">\${{ p.precio | number:'1.2-2' }}</td>
            <td class="text-right text-muted">\${{ p.costo | number:'1.2-2' }}</td>
            <td class="text-right fw-600">\${{ p.utilidad_unitaria | number:'1.2-2' }}</td>
            <td class="text-right"><span class="badge-num green">{{ p.margen | number:'1.1-1' }}%</span></td>
            <td class="text-right fw-600">{{ p.cantidad_vendida }}</td>
            <td class="text-right text-blue fw-700">\${{ p.utilidad_total | number:'1.2-2' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="empty-state" *ngIf="!loading && !error && productos.length === 0">No hay productos en el catálogo.</div>
    `
})
export class AnaliticaRentabilidadComponent implements OnInit, OnDestroy {
    productos: ProductoRentabilidad[] = [];
    loading = false;
    error = false;
    private destroy$ = new Subject<void>();

    constructor(private svc: ProductosService, private cdr: ChangeDetectorRef) {}

    ngOnInit() { this.load(); }
    ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

    load() {
        this.loading = true;
        this.error = false;
        this.svc.getRentabilidadProductos()
            .pipe(takeUntil(this.destroy$), finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            }))
            .subscribe({ 
                next: r => { this.productos = r.detalles || []; }, 
                error: (e) => { 
                    if (e.status === 403) this.error = true;
                } 
            });
    }
}
