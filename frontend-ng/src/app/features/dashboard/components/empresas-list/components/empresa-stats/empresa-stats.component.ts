
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-empresa-stats',
    standalone: true,
    imports: [CommonModule],
    template: `
      <div class="row g-4 mb-5">
        <div class="col-md-4">
          <div class="card border-0 p-4 shadow-sm h-100 rounded-5 transition-transform" style="border-left: 5px solid #000 !important;">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                     <h6 class="text-uppercase text-muted small fw-bold mb-1">Total Empresas</h6>
                     <h3 class="fw-bold mb-0 text-dark">{{ totalEmpresas }}</h3>
                </div>
                <div class="bg-light rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                    <i class="bi bi-building fs-4 text-dark opacity-50"></i>
                </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 p-4 shadow-sm h-100 rounded-5" style="border-left: 5px solid #10b981 !important;">
             <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="text-uppercase text-muted small fw-bold mb-1">Empresas Activas</h6>
                    <h3 class="fw-bold mb-0 text-dark">{{ totalActivas }}</h3>
                </div>
                <div class="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                    <i class="bi bi-check-lg fs-4 text-success"></i>
                </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 p-4 shadow-sm h-100 rounded-5" style="border-left: 5px solid #ef4444 !important;">
             <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="text-uppercase text-muted small fw-bold mb-1">Suscripciones Vencidas</h6>
                    <h3 class="fw-bold mb-0 text-dark">{{ totalVencidas }}</h3>
                </div>
                 <div class="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                    <i class="bi bi-exclamation-triangle fs-4 text-danger"></i>
                </div>
            </div>
          </div>
        </div>
      </div>
  `
})
export class EmpresaStatsComponent {
    @Input() totalEmpresas: number = 0;
    @Input() totalActivas: number = 0;
    @Input() totalVencidas: number = 0;
}
