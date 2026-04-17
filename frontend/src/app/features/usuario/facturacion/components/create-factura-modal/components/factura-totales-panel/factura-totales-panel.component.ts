import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-totales-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="totals-card-lux">
      <div class="d-flex justify-content-between mb-2">
        <span class="text-muted small-cap">Subtotal Sin IVA</span>
        <span class="fw-bold">{{ totals.subtotal_sin_iva | currency:'USD' }}</span>
      </div>
      <div class="d-flex justify-content-between mb-2">
        <span class="text-muted small-cap">Subtotal {{ ivaPercentage }}%</span>
        <span class="fw-bold">{{ totals.subtotal_con_iva | currency:'USD' }}</span>
      </div>
      <div class="d-flex justify-content-between mb-2">
        <span class="text-muted small-cap">Subtotal 0%</span>
        <span class="fw-bold">{{ totals.subtotal_sin_iva | currency:'USD' }}</span>
      </div>
      <div class="d-flex justify-content-between mb-2" *ngIf="totals.subtotal_no_objeto_iva > 0">
        <span class="text-muted small-cap">Subtotal No Objeto</span>
        <span class="fw-bold">{{ totals.subtotal_no_objeto_iva | currency:'USD' }}</span>
      </div>
      <div class="d-flex justify-content-between mb-2" *ngIf="totals.subtotal_exento_iva > 0">
        <span class="text-muted small-cap">Subtotal Exento</span>
        <span class="fw-bold">{{ totals.subtotal_exento_iva | currency:'USD' }}</span>
      </div>
      <div class="d-flex justify-content-between mb-2">
        <span class="text-muted small-cap">Descuento Total</span>
        <span class="text-danger fw-bold">- {{ totals.descuento | currency:'USD' }}</span>
      </div>
      <div class="d-flex justify-content-between mb-2">
        <span class="text-muted small-cap">IVA {{ ivaPercentage }}%</span>
        <span class="fw-bold text-dark">{{ totals.iva | currency:'USD' }}</span>
      </div>
      <div class="d-flex justify-content-between mb-3" *ngIf="totals.ice > 0">
        <span class="text-muted small-cap">ICE Total</span>
        <span class="fw-bold text-dark">{{ totals.ice | currency:'USD' }}</span>
      </div>
      <div class="total-divider mb-3"></div>
      <div class="d-flex justify-content-between align-items-center">
        <span class="fw-900 fs-5 text-dark">TOTAL PAGAR</span>
        <span class="fw-900 fs-3 text-dark">{{ totals.total | currency:'USD' }}</span>
      </div>
    </div>
  `
})
export class FacturaTotalesPanelComponent {
  @Input() totals: any = {
    subtotal_sin_iva: 0,
    subtotal_con_iva: 0,
    subtotal_no_objeto_iva: 0,
    subtotal_exento_iva: 0,
    descuento: 0,
    iva: 0,
    ice: 0,
    total: 0
  };

  get ivaPercentage(): number {
    if (!this.totals.subtotal_con_iva || this.totals.subtotal_con_iva === 0) return 0;
    return Math.round((this.totals.iva / this.totals.subtotal_con_iva) * 100);
  }
}
