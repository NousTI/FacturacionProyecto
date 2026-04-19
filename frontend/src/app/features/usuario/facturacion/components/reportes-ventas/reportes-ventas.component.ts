import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { VentasService } from '../../services/ventas.service';
import { UiService } from '../../../../../shared/services/ui.service';

@Component({
// ... (rest of metadata stays same)
  selector: 'app-reportes-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reportes-container p-4">
      <!-- HEADER & SELECTOR -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="mb-1 fw-bold">Centro de Reportes de Ventas</h4>
          <p class="text-muted small mb-0">Genera análisis detallados de tu actividad comercial</p>
        </div>
        <div class="report-selector p-1 bg-light rounded-pill d-flex">
          <button *ngFor="let r of reportTypes" 
            class="btn btn-sm rounded-pill px-3 py-2 border-0"
            [class.bg-white]="selectedReport === r.id"
            [class.shadow-sm]="selectedReport === r.id"
            [class.text-primary]="selectedReport === r.id"
            (click)="selectReport(r.id)"
          >
            {{ r.label }}
          </button>
        </div>
      </div>

      <!-- FILTERS PANEL -->
      <div class="card border-0 shadow-sm rounded-4 mb-4">
        <div class="card-body p-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted">Fecha Inicio</label>
              <input type="date" class="form-control rounded-3" [(ngModel)]="filters.fecha_inicio">
            </div>
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted">Fecha Fin</label>
              <input type="date" class="form-control rounded-3" [(ngModel)]="filters.fecha_fin">
            </div>
            <div class="col-md-3" *ngIf="selectedReport === 'R005'">
              <label class="form-label small fw-semibold text-muted">Estado</label>
              <select class="form-select rounded-3" [(ngModel)]="filters.estado">
                <option value="">Todos</option>
                <option value="DEVUELTA">Devuelta</option>
                <option value="NO_AUTORIZADA">No Autorizada</option>
              </select>
            </div>
            <div class="col-md-3">
              <button class="btn btn-primary w-100 rounded-3 py-2 d-flex align-items-center justify-content-center gap-2" 
                [disabled]="isLoading"
                (click)="cargarReporte()">
                <i class="bi bi-search" *ngIf="!isLoading"></i>
                <div class="spinner-border spinner-border-sm" *ngIf="isLoading"></div>
                Cargar Datos
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CONTENT AREA -->
      <div *ngIf="reportData; else emptyState" class="animate__animated animate__fadeIn">
        
        <!-- R-001: GENERAL SALES -->
        <div *ngIf="selectedReport === 'R001'">
          <div class="row g-4 mb-4">
            <div class="col-md-3" *ngFor="let kpi of kpis">
              <div class="card border-0 shadow-sm rounded-4 h-100 kpi-card">
                <div class="card-body p-4">
                  <p class="text-muted small fw-bold text-uppercase mb-2">{{ kpi.label }}</p>
                  <h3 class="fw-black mb-0">{{ kpi.value }}</h3>
                  <div *ngIf="kpi.trend !== undefined" class="mt-2 small fw-bold" [class.text-success]="kpi.trend >= 0" [class.text-danger]="kpi.trend < 0">
                    <i [class]="kpi.trend >= 0 ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                    {{ kpi.trend }}% vs anterior
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-4">
            <div class="col-md-6">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-header bg-transparent border-0 p-4 pb-0 d-flex justify-content-between">
                  <h6 class="fw-bold mb-0">Ventas por Establecimiento</h6>
                  <i class="bi bi-building text-primary"></i>
                </div>
                <div class="card-body p-4">
                  <div *ngFor="let item of reportData.graficos.por_establecimiento" class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                      <span class="small fw-semibold">{{ item.label }}</span>
                      <span class="small fw-bold">{{ item.value | currency }}</span>
                    </div>
                    <div class="progress rounded-pill" style="height: 8px;">
                      <div class="progress-bar bg-primary" [style.width.%]="(item.value / reportData.resumen.total_general) * 100"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6">
                <div class="card border-0 shadow-sm rounded-4 h-100">
                  <div class="card-header bg-transparent border-0 p-4 pb-0 d-flex justify-content-between">
                    <h6 class="fw-bold mb-1">Formas de Pago</h6>
                    <i class="bi bi-wallet2 text-success"></i>
                  </div>
                  <div class="card-body p-4">
                    <div class="table-responsive">
                        <table class="table table-sm border-0 align-middle">
                            <tbody>
                                <tr *ngFor="let p of reportData.graficos.por_forma_pago">
                                    <td class="small py-2">{{ getFormaPago(p.cod) }}</td>
                                    <td class="text-end fw-bold">{{ p.value | currency }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>

        <!-- R-002 to R-005: TABULAR REPORTS -->
        <div *ngIf="selectedReport !== 'R001'">
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-header bg-transparent border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 class="fw-bold mb-0">{{ getReportTitle() }}</h5>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-danger btn-sm rounded-pill px-3" (click)="exportar('pdf')">
                    <i class="bi bi-file-pdf"></i> PDF
                </button>
                <button class="btn btn-outline-success btn-sm rounded-pill px-3" (click)="exportar('excel')">
                    <i class="bi bi-file-excel"></i> Excel
                </button>
              </div>
            </div>
            <div class="card-body p-4">
              <div class="table-responsive">
                <table class="table table-hover align-middle custom-table">
                  <thead class="bg-light">
                    <tr>
                      <th *ngFor="let h of tableHeaders">{{ h }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of tabularData">
                      <td *ngFor="let k of tableKeys">
                        <ng-container [ngSwitch]="k">
                            <span *ngSwitchCase="'total'">{{ row[k] | currency }}</span>
                            <span *ngSwitchCase="'total_ventas'">{{ row[k] | currency }}</span>
                            <span *ngSwitchCase="'fecha_emision'">{{ row[k] | date:'shortDate' }}</span>
                            <span *ngSwitchDefault>{{ row[k] }}</span>
                        </ng-container>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

      <ng-template #emptyState>
        <div class="text-center py-5">
           <div class="empty-icon-box mb-3">
             <i class="bi bi-file-earmark-bar-graph"></i>
           </div>
           <h5>No hay datos cargados</h5>
           <p class="text-muted small">Selecciona un tipo de reporte y rango de fechas para comenzar.</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .reportes-container { min-height: 500px; }
    .report-selector { gap: 4px; }
    .kpi-card { transition: all 0.3s ease; border: 1px solid transparent !important; }
    .kpi-card:hover { transform: translateY(-5px); border-color: #eef2ff !important; }
    .empty-icon-box { 
        width: 80px; height: 80px; 
        background: #f1f5f9; 
        border-radius: 50%; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center;
        font-size: 2rem;
        color: #94a3b8;
    }
    .custom-table thead th {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
        padding: 15px;
        border: none;
    }
    .custom-table tbody td {
        padding: 15px;
        font-size: 13px;
        color: var(--primary-color);
        border-bottom: 1px solid #f1f5f9;
    }
    .fw-black { font-weight: 900; letter-spacing: -0.02em; }
  `]
})
export class ReportesVentasComponent implements OnInit {
  reportTypes = [
    { id: 'R001', label: 'General' },
    { id: 'R002', label: 'Mensuales' },
    { id: 'R003', label: 'Usuarios' },
    { id: 'R004', label: 'Anuladas' },
    { id: 'R005', label: 'SRI' }
  ];

  selectedReport: string = 'R001';
  isLoading: boolean = false;
  reportData: any = null;
  filters = {
    fecha_inicio: this.getInitialDate(),
    fecha_fin: new Date().toISOString().split('T')[0],
    estado: ''
  };

  kpis: any[] = [];
  tabularData: any[] = [];
  tableHeaders: string[] = [];
  tableKeys: string[] = [];

  constructor(
    private ventasService: VentasService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarReporte();
  }

  getInitialDate() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }

  selectReport(id: string) {
    this.selectedReport = id;
    this.cargarReporte();
  }

  cargarReporte() {
    this.reportData = null;

    const req = this.getServiceCall();
    // No ponemos isLoading = true si el componente ya tiene datos o es un cambio rápido
    // Pero el usuario quiere que no cargue, así que el Cache lo hará rápido.
    this.isLoading = true;
    req.pipe(finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges();
    }))
       .subscribe({
         next: (res) => {
           console.log('Report Data Received:', res);
           this.reportData = { ...res };
           if (this.selectedReport === 'R001') {
             this.buildKPIs(res.resumen);
           } else {
             this.prepareTabularData(res);
           }
           this.cd.markForCheck();
           this.cd.detectChanges();
         },
         error: (err) => {
           this.uiService.showError(err, 'Error al cargar reporte');
           this.cd.detectChanges();
         }
       });
  }

  getServiceCall() {
    switch (this.selectedReport) {
      case 'R001': return this.ventasService.getVentasGeneral(this.filters);
      case 'R002': return this.ventasService.getVentasMensuales(new Date(this.filters.fecha_inicio).getFullYear());
      case 'R003': return this.ventasService.getVentasPorUsuario(this.filters);
      case 'R004': return this.ventasService.getFacturasAnuladas(this.filters);
      case 'R005': return this.ventasService.getFacturasRechazadas(this.filters);
      default: return this.ventasService.getVentasGeneral(this.filters);
    }
  }

  buildKPIs(res: any) {
    this.kpis = [
      { label: 'Total Ventas', value: this.formatCurrency(res.total_general), trend: res.comparacion_anterior_porcentaje },
      { label: 'Facturas', value: res.cantidad_facturas },
      { label: 'Total IVA', value: this.formatCurrency(res.total_iva) },
      { label: 'Ticket Prom.', value: this.formatCurrency(res.ticket_promedio) }
    ];
  }

  prepareTabularData(res: any) {
    if (this.selectedReport === 'R003') {
        this.tabularData = [...(res.detalles || [])];
        this.tableHeaders = ['Usuario', 'Facturas', 'Total Ventas', 'Ticket Promedio'];
        this.tableKeys = ['usuario', 'facturas', 'total_ventas', 'ticket_promedio'];
    } else if (this.selectedReport === 'R002') {
        this.tabularData = [...(res || [])];
        this.tableHeaders = ['Mes', 'Facturas', 'Subtotal', 'IVA', 'Total'];
        this.tableKeys = ['mes', 'facturas', 'subtotal', 'iva', 'total'];
    } else if (this.selectedReport === 'R004') {
        this.tabularData = [...(res || [])];
        this.tableHeaders = ['Número', 'Fecha', 'Cliente', 'Total', 'Motivo'];
        this.tableKeys = ['numero_factura', 'fecha_emision', 'cliente', 'total', 'motivo'];
    } else if (this.selectedReport === 'R005') {
        this.tabularData = [...(res || [])];
        this.tableHeaders = ['Número', 'Cliente', 'Fecha Intento', 'Estado Actual'];
        this.tableKeys = ['numero_factura', 'cliente', 'fecha_intento', 'estado_actual'];
    }
  }

  formatCurrency(val: any) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  }

  getReportTitle() {
    return this.reportTypes.find(r => r.id === this.selectedReport)?.label;
  }

  getFormaPago(cod: string) {
    const map: any = { '01': 'Efectivo', '19': 'Tarjeta de Crédito', '16': 'Tarjeta de Débito', '20': 'Transferencia' };
    return map[cod] || 'Otros';
  }

  exportar(formato: string) {
    const tipoMap: any = { 'R001': 'VENTAS_GENERAL', 'R002': 'VENTAS_MENSUALES', 'R003': 'VENTAS_USUARIOS', 'R004': 'FACTURAS_ANULADAS', 'R005': 'FACTURAS_RECHAZADAS' };
    const tipo = tipoMap[this.selectedReport];
    
    this.uiService.showToast('Generando archivo...', 'info');
    
    this.ventasService.exportarReporte(tipo, formato, this.filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${tipo.toLowerCase()}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
      },
      error: (err) => this.uiService.showError(err, 'Error al exportar')
    });
  }
}

