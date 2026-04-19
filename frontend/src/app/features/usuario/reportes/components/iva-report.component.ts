import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { IVAReport } from '../services/financial-reports.service';

@Component({
  selector: 'app-iva-report',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="row g-4 fade-in">
      <div class="col-md-8">
        <div class="card glass-card h-100">
          <div class="card-body">
            <h6 class="fw-bold mb-4">Desglose de Ventas por Tarifa (Formulario 104)</h6>
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th class="text-end">Base Imponible</th>
                    <th class="text-end">IVA Cobrado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ventas Tarifa 0%</td>
                    <td class="text-end">{{ data.ventas.tarifa_0 | currency }}</td>
                    <td class="text-end">$0.00</td>
                  </tr>
                  <tr>
                    <td>Ventas Tarifa 15%</td>
                    <td class="text-end">{{ data.ventas.base_imponible_15 | currency }}</td>
                    <td class="text-end">{{ data.ventas.iva_cobrado_15 | currency }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card glass-card highlight h-100">
          <div class="card-body">
            <h6 class="fw-bold mb-4">Resumen de IVA</h6>
            <div class="resumen-iva-item d-flex justify-content-between mb-3">
              <span>IVA Cobrado (+)</span>
              <span class="fw-bold">{{ data.resumen.iva_cobrado | currency }}</span>
            </div>
            <div class="resumen-iva-item d-flex justify-content-between mb-3 text-danger">
              <span>IVA Pagado (-)</span>
              <span>({{ data.resumen.iva_pagado | currency }})</span>
            </div>
            <hr>
            <div class="resumen-iva-total d-flex justify-content-between">
              <span class="fw-bold">IVA A PAGAR</span>
              <span class="fw-bold h4 mb-0 text-dark">{{ data.resumen.iva_a_pagar | currency }}</span>
            </div>
            <p class="text-muted small mt-4">* Datos basados en facturas autorizadas en el sistema.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .glass-card.highlight { border-left: 6px solid #3b82f6; }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class IvaReportComponent {
  @Input() data!: IVAReport;
}

