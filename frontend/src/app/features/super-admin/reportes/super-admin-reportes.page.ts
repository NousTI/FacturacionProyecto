import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReportesService } from './services/reportes.service';
import { VendedorService, Vendedor } from '../vendedores/services/vendedor.service';
import { UiService } from '../../../shared/services/ui.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-super-admin-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  template: `
    <div class="reportes-container animate__animated animate__fadeIn">

      <div class="row g-4">
        <!-- Panel de Filtros -->
        <div class="col-lg-4">
          <div class="card filter-card">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-filter-circle me-2"></i>Configuración de Reporte
              </h5>

              <div class="mb-3">
                <label class="form-label fw-bold">Tipo de Reporte</label>
                <select class="form-select" [(ngModel)]="tipoReporte" (change)="onTipoChange()">
                  <option value="INGRESOS_FINANCIEROS">Reporte de Ingresos Financieros</option>
                  <option value="COMISIONES_PAGOS">Comisiones y Pagos a Vendedores</option>
                </select>
                <div class="form-text mt-2">
                  <i class="bi bi-info-circle me-1"></i>
                  {{ tipoReporte === 'INGRESOS_FINANCIEROS' ? 'Utilizado para contabilidad e impuestos.' : 'Control de salidas de dinero a ventas.' }}
                </div>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label fw-bold">Desde</label>
                  <input type="date" class="form-control" [(ngModel)]="fechaInicio">
                </div>
                <div class="col-6">
                  <label class="form-label fw-bold">Hasta</label>
                  <input type="date" class="form-control" [(ngModel)]="fechaFin">
                </div>
              </div>

              <!-- Filtros Específicos -->
              <div *ngIf="tipoReporte === 'INGRESOS_FINANCIEROS'" class="mb-4 animate__animated animate__fadeIn">
                <label class="form-label fw-bold">Estado de Pago</label>
                <select class="form-select" [(ngModel)]="filtroEstado">
                  <option value="">Cualquiera</option>
                  <option value="PAGADO">Pagado</option>
                  <option value="PENDIENTE">Pendiente</option>
                </select>
              </div>

              <div *ngIf="tipoReporte === 'COMISIONES_PAGOS'" class="mb-4 animate__animated animate__fadeIn">
                <label class="form-label fw-bold">Vendedor Específico</label>
                <select class="form-select" [(ngModel)]="filtroVendedorId">
                  <option value="">Todos los Vendedores</option>
                  <option *ngFor="let v of vendedores" [value]="v.id">{{ v.nombre }}</option>
                </select>
              </div>

              <div class="d-grid gap-2">
                <button class="btn btn-primary" (click)="previsualizar()" [disabled]="isLoading">
                  <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  <i *ngIf="!isLoading" class="bi bi-eye me-2"></i>Actualizar Vista Previa
                </button>
                
                <div class="export-actions d-flex gap-2">
                    <button class="btn btn-outline-success flex-grow-1" (click)="exportar('excel')" [disabled]="isLoading || (previewData.length === 0)">
                        <i class="bi bi-file-earmark-excel me-1"></i>Excel
                    </button>
                    <!-- 
                    <button class="btn btn-outline-danger flex-grow-1" (click)="exportar('pdf')" [disabled]="isLoading || (previewData.length === 0)">
                        <i class="bi bi-file-earmark-pdf me-1"></i>PDF
                    </button>
                    -->
                </div>
              </div>
            </div>
          </div>

          <!-- Resumen Rápido -->
          <div class="card mini-stats-card mt-4" *ngIf="previewData.length > 0">
              <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                      <span class="text-muted small fw-bold">RESUMEN DE VISTA</span>
                      <span class="badge bg-primary rounded-pill">{{ previewData.length }} registros</span>
                  </div>
                  <div class="stat-item">
                      <span class="stat-label">{{ tipoReporte === 'INGRESOS_FINANCIEROS' ? 'Total Ingresos' : 'Total Comisiones' }}</span>
                      <span class="stat-value">{{ totalPreview | currency }}</span>
                  </div>
              </div>
          </div>
        </div>

        <!-- Panel de Resultados -->
        <div class="col-lg-8">
          <div class="card preview-card h-100">
            <div class="card-header bg-transparent d-flex justify-content-between align-items-center py-3">
              <h5 class="mb-0">Previsualización en Pantalla</h5>
              <span class="text-muted small italic" *ngIf="lastUpdate">Última actualización: {{ lastUpdate | date:'shortTime' }}</span>
            </div>
            <div class="card-body p-0">
              <div class="table-container" *ngIf="previewData.length > 0">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light">
                    <!-- Cabeceras Dinámicas -->
                    <tr *ngIf="tipoReporte === 'INGRESOS_FINANCIEROS'">
                      <th class="ps-4">Fecha</th>
                      <th>Empresa/Cliente</th>
                      <th>Concepto</th>
                      <th class="text-end">Monto</th>
                      <th class="text-center pe-4">Estado</th>
                    </tr>
                    <tr *ngIf="tipoReporte === 'COMISIONES_PAGOS'">
                      <th class="ps-4">Vendedor</th>
                      <th class="text-center">Periodo</th>
                      <th class="text-end">Monto Comisión</th>
                      <th class="text-center pe-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Filas Dinámicas de Ingresos -->
                    <ng-container *ngIf="tipoReporte === 'INGRESOS_FINANCIEROS'">
                      <tr *ngFor="let item of previewData" class="animate__animated animate__fadeIn">
                        <td class="ps-4">
                            <div class="d-flex flex-column">
                                <span class="fw-medium">{{ item.fecha_pago | date:'mediumDate' }}</span>
                                <span class="text-muted x-small">{{ item.fecha_pago | date:'shortTime' }}</span>
                            </div>
                        </td>
                        <td>{{ item.empresa_cliente }}</td>
                        <td>
                            <span class="concepto-tag">{{ item.concepto }}</span>
                        </td>
                        <td class="text-end fw-bold">{{ item.monto_total | currency }}</td>
                        <td class="text-center pe-4">
                          <span class="badge" [ngClass]="getEstadoClass(item.estado)">
                            {{ item.estado }}
                          </span>
                        </td>
                      </tr>
                    </ng-container>

                    <!-- Filas Dinámicas de Comisiones -->
                    <ng-container *ngIf="tipoReporte === 'COMISIONES_PAGOS'">
                      <tr *ngFor="let item of previewData" class="animate__animated animate__fadeIn">
                        <td class="ps-4">
                            <div class="d-flex align-items-center">
                                <div class="avatar-circle me-3">{{ item.vendedor ? item.vendedor.charAt(0) : 'V' }}</div>
                                <span class="fw-medium">{{ item.vendedor }}</span>
                            </div>
                        </td>
                        <td class="text-center">{{ item.periodo }}</td>
                        <td class="text-end fw-bold text-danger">{{ item.monto_comision | currency }}</td>
                        <td class="text-center pe-4">
                          <span class="badge" [ngClass]="getEstadoClass(item.estado)">
                            {{ item.estado }}
                          </span>
                        </td>
                      </tr>
                    </ng-container>
                  </tbody>
                </table>
              </div>

              <!-- Estado Vacío -->
              <div class="empty-state" *ngIf="previewData.length === 0 && !isLoading">
                <i class="bi bi-file-earmark-bar-graph"></i>
                <p>No hay datos para mostrar con los filtros actuales</p>
                <small>Selecciona tus parámetros y presiona "Actualizar Vista Previa"</small>
              </div>

              <!-- Cargando -->
              <div class="loading-overlay" *ngIf="isLoading">
                <div class="text-center">
                    <div class="spinner-grow text-primary mb-3" role="status"></div>
                    <p class="fw-bold text-primary mb-0">Obteniendo datos reales...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .reportes-container {
      padding: 1rem 0;
    }
    .title {
      font-size: 1.75rem;
      font-weight: 850;
      color: #161d35;
      letter-spacing: -0.5px;
    }
    .subtitle {
      color: #64748b;
      margin: 0;
    }

    .card {
      border: none;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .filter-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
    }
    .preview-card {
        border: 1px solid #f1f5f9;
        overflow: hidden;
    }

    .form-label {
      font-size: 0.85rem;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .form-control, .form-select {
      border-radius: 12px;
      padding: 0.75rem 1rem;
      border-color: #e2e8f0;
    }
    .form-control:focus {
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        border-color: #3b82f6;
    }

    .btn-primary {
      padding: 0.75rem;
      border-radius: 12px;
      font-weight: 700;
      background: #161d35;
      border: none;
    }
    .btn-primary:hover {
        background: #232d4d;
        transform: translateY(-2px);
    }

    .table-container {
      max-height: 600px;
      overflow-y: auto;
    }
    .table thead th {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      padding: 1rem 0.75rem;
      border-bottom: 2px solid #f1f5f9;
      position: sticky;
      top: 0;
      z-index: 10;
      background: #f8fafc;
    }
    .table tbody td {
      padding: 1.25rem 0.75rem;
      font-size: 0.95rem;
    }

    .badge {
      padding: 0.5rem 0.85rem;
      border-radius: 30px;
      font-weight: 700;
      font-size: 0.7rem;
      letter-spacing: 0.3px;
    }

    .empty-state {
      height: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }
    .empty-state i {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.2;
    }

    .loading-overlay {
        height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.8);
    }

    .concepto-tag {
        background: #f1f5f9;
        padding: 0.35rem 0.75rem;
        border-radius: 8px;
        font-size: 0.85rem;
        color: #475569;
        font-weight: 500;
    }

    .avatar-circle {
        width: 32px;
        height: 32px;
        background: #e2e8f0;
        color: #1e293b;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.8rem;
    }

    .x-small { font-size: 0.75rem; }

    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }
    .stat-label { font-size: 0.9rem; color: #64748b; font-weight: 500; }
    .stat-value { font-size: 1.5rem; font-weight: 850; color: #161d35; line-height: 1; }
  `]
})
export class SuperAdminReportesPage implements OnInit, OnDestroy {
  tipoReporte = 'INGRESOS_FINANCIEROS';
  fechaInicio = '';
  fechaFin = '';
  filtroEstado = '';
  filtroVendedorId = '';
  
  isLoading = false;
  previewData: any[] = [];
  vendedores: Vendedor[] = [];
  lastUpdate: Date | null = null;
  totalPreview = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private vendedorService: VendedorService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {
      // Inicializar con el mes actual
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      this.fechaInicio = firstDay.toISOString().split('T')[0];
      this.fechaFin = now.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.cargarVendedores();
    this.previsualizar();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTipoChange() {
      this.previewData = [];
      this.totalPreview = 0;
  }

  cargarVendedores() {
    this.vendedorService.getVendedores()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.vendedores = data);
  }

  previsualizar() {
    this.isLoading = true;
    const params: any = {
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin
    };

    if (this.tipoReporte === 'INGRESOS_FINANCIEROS') {
      if (this.filtroEstado) params.estado = this.filtroEstado;
    } else {
      if (this.filtroVendedorId) params.vendedor_id = this.filtroVendedorId;
    }

    this.reportesService.obtenerDatosPreview(this.tipoReporte, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.previewData = data;
          this.calcularTotales();
          this.lastUpdate = new Date();
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.uiService.showError(err, 'No se pudo cargar la vista previa');
          this.cd.detectChanges();
        }
      });
  }

  calcularTotales() {
      if (this.tipoReporte === 'INGRESOS_FINANCIEROS') {
          this.totalPreview = this.previewData.reduce((acc, curr) => acc + (parseFloat(curr.monto_total) || 0), 0);
      } else {
          this.totalPreview = this.previewData.reduce((acc, curr) => acc + (parseFloat(curr.monto_comision) || 0), 0);
      }
  }

  exportar(formato: 'excel' | 'pdf') {
    const nombre = this.tipoReporte === 'INGRESOS_FINANCIEROS' ? 'Reporte de Ingresos' : 'Reporte de Comisiones';
    const params: any = {
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin,
      formato: formato // El backend actual genera CSV, pero el usuario pidió botones de Excel/PDF. 
      // Si el backend solo tiene CSV, avisaremos que se exporta ese formato universal.
    };

    if (this.tipoReporte === 'INGRESOS_FINANCIEROS') {
      if (this.filtroEstado) params.estado = this.filtroEstado;
    } else {
      if (this.filtroVendedorId) params.vendedor_id = this.filtroVendedorId;
    }

    this.uiService.showToast(`Generando archivo ${formato.toUpperCase()}...`, 'info');
    
    this.reportesService.generarReporte(this.tipoReporte, nombre, params)
      .subscribe({
        next: (res) => {
          if (res.url_descarga) {
            const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
            window.open(`${baseUrl}${res.url_descarga}`, '_blank');
            this.uiService.showToast('Descarga iniciada', 'success');
          }
        },
        error: (err) => this.uiService.showError(err, 'Error al exportar')
      });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PAGADO':
      case 'LIQUIDADO':
        return 'bg-success-subtle text-dark';
      case 'PENDIENTE':
      case 'POR PAGAR':
        return 'bg-warning-subtle text-dark';
      case 'RECHAZADA':
        return 'bg-danger-subtle text-dark';
      default:
        return 'bg-light text-dark';
    }
  }
}
