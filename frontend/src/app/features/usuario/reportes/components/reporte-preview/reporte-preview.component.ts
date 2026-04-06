import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-reporte-preview',
  standalone: true,
  imports: [CommonModule],
  providers: [CurrencyPipe, DecimalPipe],
  template: `
    <div class="modal-backdrop-glass" (click)="onClose.emit()">
      <div class="preview-modal-content animate__animated animate__zoomIn" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header d-flex justify-content-between align-items-center p-4 border-bottom">
          <h5 class="m-0 fw-800 text-dark">Previsualización: {{ data?.nombre || 'Reporte Financiero' }}</h5>
          <button class="btn-close-minimal" (click)="onClose.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4 scroll-container">
          <!-- CASO ESTADO DE RESULTADOS -->
          <div *ngIf="tipo === 'ESTADO_RESULTADOS'" class="pyg-report">
            <h4 class="text-center mb-4 text-primary fw-bold text-uppercase letter-spacing-1">Estado de Resultados</h4>
            
            <!-- SECCION INGRESOS -->
            <div class="row align-items-center mb-1 bg-light py-2 px-3 fw-800">
                <div class="col-8">INGRESOS</div>
                <div class="col-4 text-end">{{ data?.ventas | currency }}</div>
            </div>
            <div class="row ps-4 mb-1 text-muted fw-600">
                <div class="col-8">Ventas Brutas</div>
                <div class="col-4 text-end">{{ data?.ventas | currency }}</div>
            </div>
            <div class="row ps-4 mb-2 text-muted fw-600 border-bottom-1 pb-1">
                <div class="col-8">(-) Descuentos Aplicados</div>
                <div class="col-4 text-end">({{ data?.descuentos | currency }})</div>
            </div>
            <div class="row py-2 px-3 fw-800 border-top-2 mb-4 bg-indigo-50 text-indigo rounded">
                <div class="col-8">INGRESOS NETOS</div>
                <div class="col-4 text-end">{{ data?.ingresos_netos | currency }}</div>
            </div>

            <!-- SECCION COSTOS -->
            <div class="row align-items-center mb-2 bg-light py-2 px-3 fw-800">
                <div class="col-8">COSTOS Y GASTOS</div>
                <div class="col-4 text-end">({{ (data?.costo_ventas + data?.total_gastos_operativos) | currency }})</div>
            </div>
            <div class="row ps-4 mb-2 text-muted fw-600">
                <div class="col-8">Costo de Ventas (Mercancías)</div>
                <div class="col-4 text-end">({{ data?.costo_ventas | currency }})</div>
            </div>
            <div class="row py-2 px-3 fw-800 border-top-1 mb-4 bg-emerald-50 text-emerald rounded">
                <div class="col-8">UTILIDAD BRUTA</div>
                <div class="col-4 text-end">{{ (data?.ingresos_netos - data?.costo_ventas) | currency }}</div>
            </div>

            <!-- SECCION GASTOS OPERATIVOS -->
            <div class="row ps-4 mb-1 text-muted fw-800 text-uppercase" style="font-size: 0.8rem;">Gastos Operativos:</div>
            <div *ngFor="let g of data?.gastos_operativos" class="row ps-5 mb-1 text-muted fw-500">
                <div class="col-8">{{ g.nombre }}</div>
                <div class="col-4 text-end">({{ g.valor | currency }})</div>
            </div>
            <div class="row ps-4 py-2 px-3 fw-700 bg-rose-50 text-rose rounded-pill mb-4 mt-2" style="font-size: 0.9rem;">
                <div class="col-8 text-uppercase">Total Gastos Operativos</div>
                <div class="col-4 text-end">({{ data?.total_gastos_operativos | currency }})</div>
            </div>

            <!-- FINAL: UTILIDADES -->
            <div class="row py-2 px-3 fw-800 border-top-2 mt-4 bg-slate-100 rounded">
                <div class="col-8">UTILIDAD OPERACIONAL</div>
                <div class="col-4 text-end">{{ (data?.ingresos_netos - data?.costo_ventas - data?.total_gastos_operativos) | currency }}</div>
            </div>
            <div class="row py-3 px-3 fw-900 border-top-4 mt-2 bg-dark text-white rounded shadow-lg">
                <div class="col-8">UTILIDAD NETA DEL PERIODO</div>
                <div class="col-4 text-end fs-5">{{ (data?.ingresos_netos - data?.costo_ventas - data?.total_gastos_operativos - data?.gastos_financieros) | currency }}</div>
            </div>
          </div>

          <!-- CASO IVA 104 -->
          <div *ngIf="tipo === 'IVA_104'" class="iva-report">
            <h4 class="text-center mb-4 text-indigo fw-bold">RESUMEN - FORMULARIO 104 (IVA)</h4>
            
            <div class="iva-card p-3 mb-4 border rounded-4 bg-primary-subtle border-primary-subtle text-primary">
                <div class="row text-center fw-bold">
                    <div class="col-12 mb-2 border-bottom pb-2">IVA A PAGAR AL SRI</div>
                    <div class="col-12 fs-3">{{ (data?.iva_cobrado - data?.iva_pagado) | currency }}</div>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-6">
                    <div class="p-3 border rounded-4 bg-white">
                        <div class="fw-800 text-dark border-bottom mb-2 pb-1">VENTAS</div>
                        <div class="d-flex justify-content-between text-muted small">
                            <span>Base 0%</span> <span>{{ data?.ventas_tarifa_0 | currency }}</span>
                        </div>
                        <div class="d-flex justify-content-between text-muted small">
                            <span>Base Grabada</span> <span>{{ data?.ventas_tarifa_gravada | currency }}</span>
                        </div>
                        <div class="d-flex justify-content-between fw-bold text-indigo mt-2 pt-2 border-top">
                            <span>IVA Cobrado</span> <span>{{ data?.iva_cobrado | currency }}</span>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="p-3 border rounded-4 bg-white">
                        <div class="fw-800 text-dark border-bottom mb-2 pb-1">COMPRAS</div>
                        <div class="d-flex justify-content-between text-muted small">
                            <span>Base 0%</span> <span>{{ data?.compras_tarifa_0 | currency }}</span>
                        </div>
                        <div class="d-flex justify-content-between text-muted small">
                            <span>Base Grabada</span> <span>{{ data?.compras_tarifa_gravada | currency }}</span>
                        </div>
                        <div class="d-flex justify-content-between fw-bold text-rose mt-2 pt-2 border-top">
                            <span>IVA Pagado</span> <span>{{ data?.iva_pagado | currency }}</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          
        </div>

        <!-- Footer -->
        <div class="modal-footer p-3 bg-light border-top rounded-bottom-4 d-flex justify-content-between">
          <p class="small text-muted mb-0">* Valores calculados en base a transacciones registradas hasta hoy.</p>
          <button class="btn btn-primary rounded-pill px-4 shadow-sm" (click)="onClose.emit()">
            Entendido
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop-glass {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(12px);
      z-index: 1050;
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
    }
    .preview-modal-content {
      background: white; border-radius: 24px;
      width: 100%; max-width: 800px;
      max-height: 90vh; display: flex; flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .scroll-container { overflow-y: auto; flex: 1; }
    .btn-close-minimal {
      border: none; background: #f1f5f9; width: 36px; height: 36px;
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      color: #64748b; transition: all 0.2s;
    }
    .btn-close-minimal:hover { background: #fee2e2; color: #ef4444; }
    .fw-800 { font-weight: 800; }
    .fw-900 { font-weight: 900; }
    .fw-700 { font-weight: 700; }
    .fw-600 { font-weight: 600; }
    .letter-spacing-1 { letter-spacing: 1px; }
    .bg-indigo-50 { background-color: #eef2ff; }
    .text-indigo { color: #4f46e5; }
    .bg-emerald-50 { background-color: #ecfdf5; }
    .text-emerald { color: #10b981; }
    .bg-rose-50 { background-color: #fff1f2; }
    .text-rose { color: #f43f5e; }
    .border-top-2 { border-top: 2px solid #e2e8f0; }
    .border-top-4 { border-top: 4px solid #334155; }
  `]
})
export class ReportePreviewComponent {
  @Input() data: any;
  @Input() tipo: string = 'ESTADO_RESULTADOS';
  @Output() onClose = new EventEmitter<void>();
}
