import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { CuentasCobrarService } from './services/cuentas-cobrar.service';
import { CuentasCobrarOverview, CuentasCobrarFiltros } from '../../../domain/models/cuentas-cobrar.model';
import { UiService } from '../../../shared/services/ui.service';
import { ClientesService } from '../clientes/services/clientes.service';
import { Cliente } from '../../../domain/models/cliente.model';

Chart.register(...registerables);

@Component({
  selector: 'app-cuentas-cobrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cc-page-container">
      <div class="container-fluid py-3">
        
        <!-- COMPACT HEADER & FILTERS -->
        <div class="row g-3 mb-4 align-items-center">
          <div class="col-lg-4">
             <div class="card stat-card total-card h-100">
                <div class="card-body py-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <span class="stat-label mb-1">Total por Cobrar</span>
                      <h2 class="stat-value text-indigo mb-0">{{ data?.resumen?.total_por_cobrar | currency:'USD':'symbol':'1.2-2' }}</h2>
                    </div>
                    <div class="icon-circle bg-indigo-soft">
                      <i class="bi bi-wallet2"></i>
                    </div>
                  </div>
                </div>
              </div>
          </div>
          <div class="col-lg-8">
             <div class="card filter-card border-0 shadow-sm h-100">
                <div class="card-body py-3">
                   <div class="d-flex flex-wrap gap-3 align-items-end justify-content-between">
                      <div class="filter-group flex-grow-1">
                         <label class="filter-label">Fecha de Corte</label>
                         <input type="date" class="form-control form-control-sm" [(ngModel)]="filtros.fecha_corte" (change)="loadData()">
                      </div>

                      <div class="filter-group flex-grow-1">
                         <label class="filter-label">Estado</label>
                         <select class="form-select form-select-sm" [(ngModel)]="filtros.estado" (change)="loadData()">
                            <option value="">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="vencido">Vencido</option>
                            <option value="parcial">Parcial</option>
                         </select>
                      </div>

                      <div class="filter-group flex-grow-2">
                         <label class="filter-label">Cliente</label>
                         <select class="form-select form-select-sm" [(ngModel)]="filtros.cliente_id" (change)="loadData()">
                            <option value="">Todos los Clientes</option>
                            <option *ngFor="let c of clientes" [value]="c.id">{{ c.razon_social }}</option>
                         </select>
                      </div>

                      <button class="btn btn-indigo-premium btn-sm" (click)="loadData()" [disabled]="isLoading">
                        <i class="bi bi-arrow-clockwise" [class.spinning]="isLoading"></i>
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div *ngIf="isLoading && !data" class="d-flex justify-content-center py-5">
           <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div *ngIf="data">
          <!-- BUCKETS -->
          <div class="row g-3 mb-4">
            <div class="col-md-3">
              <div class="card stat-card border-bottom-success">
                <div class="card-body">
                  <span class="stat-label">Vigente (no vencido)</span>
                  <div class="d-flex align-items-end justify-content-between">
                    <h3 class="stat-value mb-0 text-sm-fluid">{{ data.resumen.vigente.monto | currency:'USD' }}</h3>
                    <span class="badge bg-success-soft text-success">{{ data.resumen.vigente.porcentaje }}%</span>
                  </div>
                  <div class="progress mt-3" style="height: 6px;">
                    <div class="progress-bar bg-success" [style.width.%]="data.resumen.vigente.porcentaje"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card stat-card border-bottom-warning">
                <div class="card-body">
                  <span class="stat-label">Vencido 1-30 días</span>
                  <div class="d-flex align-items-end justify-content-between">
                    <h3 class="stat-value mb-0">{{ data.resumen.vencido_1_30.monto | currency:'USD' }}</h3>
                    <span class="badge bg-warning-soft text-warning">{{ data.resumen.vencido_1_30.porcentaje }}%</span>
                  </div>
                   <div class="progress mt-3" style="height: 6px;">
                    <div class="progress-bar bg-warning" [style.width.%]="data.resumen.vencido_1_30.porcentaje"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card stat-card border-bottom-orange">
                <div class="card-body">
                  <span class="stat-label">Vencido 31-60 días</span>
                  <div class="d-flex align-items-end justify-content-between">
                    <h3 class="stat-value mb-0">{{ data.resumen.vencido_31_60.monto | currency:'USD' }}</h3>
                    <span class="badge bg-orange-soft text-orange">{{ data.resumen.vencido_31_60.porcentaje }}%</span>
                  </div>
                   <div class="progress mt-3" style="height: 6px;">
                    <div class="progress-bar bg-orange" [style.width.%]="data.resumen.vencido_31_60.porcentaje"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card stat-card border-bottom-danger">
                <div class="card-body">
                  <span class="stat-label">Vencido más de 60 días</span>
                  <div class="d-flex align-items-end justify-content-between">
                    <h3 class="stat-value mb-0">{{ data.resumen.vencido_60_mas.monto | currency:'USD' }}</h3>
                    <span class="badge bg-danger-soft text-danger">{{ data.resumen.vencido_60_mas.porcentaje }}%</span>
                  </div>
                   <div class="progress mt-3" style="height: 6px;">
                    <div class="progress-bar bg-danger" [style.width.%]="data.resumen.vencido_60_mas.porcentaje"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CHARTS row -->
          <div class="row g-4 mb-4">
             <div class="col-lg-5">
                <div class="card chart-card h-100">
                   <div class="card-header border-0 bg-transparent py-3">
                      <h5 class="card-title mb-0 fw-bold">Antigüedad de Cartera</h5>
                   </div>
                   <div class="card-body d-flex align-items-center justify-content-center" style="min-height: 300px;">
                      <canvas #agingChart></canvas>
                   </div>
                </div>
             </div>
             <div class="col-lg-7">
                <div class="card chart-card h-100">
                   <div class="card-header border-0 bg-transparent py-3">
                      <h5 class="card-title mb-0 fw-bold">Top 10 Clientes Morosos</h5>
                   </div>
                   <div class="card-body" style="min-height: 300px;">
                      <canvas #morososChart></canvas>
                   </div>
                </div>
             </div>
          </div>

          <!-- DETAILED LIST -->
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
             <div class="card-header border-0 bg-white py-3 ps-4">
                <h5 class="mb-0 fw-bold">Detalle de Cartera</h5>
             </div>
             <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                   <thead class="bg-light">
                      <tr>
                         <th class="ps-4">Cliente</th>
                         <th>N° Factura</th>
                         <th>Emisión</th>
                         <th>Vencimiento</th>
                         <th class="text-end">Monto</th>
                         <th class="text-end">Pagado</th>
                         <th class="text-end">Saldo</th>
                         <th class="text-center">Días Venc.</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr *ngFor="let item of data.listado" [class.table-danger-light]="item.dias_vencido > 0">
                         <td class="ps-4">
                            <span class="fw-bold">{{ item.cliente_nombre }}</span>
                         </td>
                         <td>{{ item.numero_documento }}</td>
                         <td>{{ item.fecha_emision | date:'dd/MM/yyyy' }}</td>
                         <td>{{ item.fecha_vencimiento | date:'dd/MM/yyyy' }}</td>
                         <td class="text-end">{{ item.monto_total | currency:'USD' }}</td>
                         <td class="text-end text-success">{{ item.monto_pagado | currency:'USD' }}</td>
                         <td class="text-end text-danger fw-bold">{{ item.saldo_pendiente | currency:'USD' }}</td>
                         <td class="text-center">
                            <span class="badge" [ngClass]="item.dias_vencido > 0 ? 'bg-danger' : 'bg-success'">
                               {{ item.dias_vencido }}
                            </span>
                         </td>
                      </tr>
                   </tbody>
                </table>
             </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .cc-page-container {
      background: #f8fafc;
      min-height: 100vh;
    }
    .page-title {
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 0.2rem;
    }
    .page-subtitle {
      color: #64748b;
      font-size: 0.9rem;
    }
    .btn-indigo-premium {
      background: #4338ca;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-indigo-premium:hover {
      background: #3730a3;
      box-shadow: 0 4px 12px rgba(67, 56, 202, 0.2);
    }
    .filter-group {
       display: flex;
       flex-direction: column;
       gap: 2px;
    }
    .filter-label {
       font-size: 0.7rem;
       font-weight: 700;
       color: #94a3b8;
       text-transform: uppercase;
       margin-left: 2px;
    }
    .min-w-150 { min-width: 150px; }
    .bg-indigo-soft { background: #e0e7ff; color: #4338ca; }
    .text-indigo { color: #4338ca; }
    .bg-success-soft { background: #d1fae5; }
    .bg-warning-soft { background: #fef3c7; }
    .bg-orange-soft { background: #ffedd5; }
    .text-orange { color: #f97316; }
    .bg-orange { background: #f97316; }
    .bg-danger-soft { background: #fee2e2; }
    
    .border-bottom-success { border-bottom: 4px solid #10b981; }
    .border-bottom-warning { border-bottom: 4px solid #f59e0b; }
    .border-bottom-orange { border-bottom: 4px solid #f97316; }
    .border-bottom-danger { border-bottom: 4px solid #ef4444; }

    .stat-card {
      border: none;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .total-card {
       background: white;
       border-left: 5px solid #4338ca;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.75rem;
      display: block;
    }
    .stat-value {
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
    }
    .chart-card {
       border: none;
       border-radius: 20px;
       box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .table-hover tbody tr:hover {
       background-color: #f1f5f9;
    }
    .badge {
       padding: 0.5em 0.8em;
       font-weight: 600;
       border-radius: 6px;
    }
    .spinning {
       display: inline-block;
       animation: spin 1s linear infinite;
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class CuentasCobrarPage implements OnInit {
  @ViewChild('agingChart') agingChartCanvas!: ElementRef;
  @ViewChild('morososChart') morososChartCanvas!: ElementRef;

  data: CuentasCobrarOverview | null = null;
  isLoading = false;
  clientes: Cliente[] = [];
  filtros: CuentasCobrarFiltros = {
    fecha_corte: new Date().toISOString().split('T')[0],
    estado: '',
    cliente_id: ''
  };

  private charts: any[] = [];

  constructor(
    private ccService: CuentasCobrarService,
    private clientesService: ClientesService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchClientes();
    this.loadData();
  }

  fetchClientes() {
    this.clientesService.getClientes().subscribe({
      next: (res) => {
        this.clientes = res;
        this.cd.detectChanges();
      }
    });
  }

  loadData() {
    this.isLoading = true;
    this.ccService.getResumen(this.filtros)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.data = res;
          setTimeout(() => this.initCharts(), 0);
        },
        error: (err) => this.uiService.showError(err, 'Error al cargar el reporte de cobros')
      });
  }

  private initCharts() {
    if (!this.data) return;

    // Destroy existing charts
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    // Aging Pie Chart
    const agingCtx = this.agingChartCanvas.nativeElement.getContext('2d');
    const agingData = this.data.graficos.distribucion_antiguedad;
    
    this.charts.push(new Chart(agingCtx, {
      type: 'doughnut',
      data: {
        labels: agingData.map(d => d.label),
        datasets: [{
          data: agingData.map(d => d.value),
          backgroundColor: ['#10b981', '#f59e0b', '#f87171', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
        }
      }
    }));

    // Morosos Bar Chart
    const morososCtx = this.morososChartCanvas.nativeElement.getContext('2d');
    const morososData = this.data.graficos.top_clientes_morosos;

    this.charts.push(new Chart(morososCtx, {
      type: 'bar',
      data: {
        labels: morososData.map(d => d.label),
        datasets: [{
          label: 'Saldo Pendiente (USD)',
          data: morososData.map(d => d.value),
          backgroundColor: 'rgba(79, 70, 229, 0.8)',
          hoverBackgroundColor: '#4f46e5',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' } } }
        }
      }
    }));
  }
}
