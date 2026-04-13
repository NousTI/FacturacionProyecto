import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import {
  ReportesService, ReporteGlobal
} from '../../services/reportes.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';
import { environment } from '../../../../../../environments/environment';

type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'mes_especifico' | 'anio_especifico' | 'personalizado';

@Component({
  selector: 'app-r-031-global',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, InfoTooltipComponent],
  template: `
    <div class="section-header mb-4">
      <div>
        <h5 class="section-title">R-031 — Reporte Global del Sistema</h5>
        <p class="section-sub">Vista consolidada de todas las empresas, ingresos y zonas críticas</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn-generar" (click)="generar()" [disabled]="loading">
          <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!loading" class="bi bi-arrow-clockwise me-2"></i>
          {{ loading ? 'Generando...' : 'Generar Reporte' }}
        </button>
        <button class="btn-pdf" (click)="exportarPDF()" [disabled]="!datos || loadingPDF">
          <span *ngIf="loadingPDF" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!loadingPDF" class="bi bi-file-earmark-pdf me-2"></i>
          {{ loadingPDF ? 'Generando PDF...' : 'Exportar PDF' }}
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filtros-card mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label-sm">Rango</label>
          <select class="form-select form-select-sm" [(ngModel)]="rangoTipo" (change)="onRangoChange()">
            <option value="mes_actual">Mes actual</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="anio_actual">Año actual</option>
            <option value="mes_especifico">Mes específico</option>
            <option value="anio_especifico">Año específico</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'mes_especifico'">
          <label class="form-label-sm">Mes</label>
          <select class="form-select form-select-sm" [(ngModel)]="mesFiltro" (change)="onRangoChange()">
            <option *ngFor="let m of meses; let i = index" [value]="i+1">{{ m }}</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'mes_especifico' || rangoTipo === 'anio_especifico'">
          <label class="form-label-sm">Año</label>
          <input type="number" class="form-control form-control-sm" [(ngModel)]="anioFiltro" (change)="onRangoChange()" [min]="2020" [max]="anioActual">
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'personalizado'">
          <label class="form-label-sm">Desde</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaInicio">
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'personalizado'">
          <label class="form-label-sm">Hasta</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaFin">
        </div>
        <div class="col-auto">
          <span class="rango-preview">{{ fechaInicio }} → {{ fechaFin }}</span>
        </div>
      </div>
    </div>

    <!-- Estado vacío/Loading -->
    <div class="empty-state" *ngIf="!datos && !loading">
      <i class="bi bi-graph-up-arrow"></i>
      <p>Presiona <strong>Generar Reporte</strong> para cargar los datos</p>
    </div>
    <div class="loading-state" *ngIf="loading">
      <div class="spinner-grow text-primary" role="status"></div>
      <p>Obteniendo datos del sistema...</p>
    </div>

    <div *ngIf="datos" id="print-global">
      <!-- KPIs -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <span class="kpi-label">Empresas activas</span>
          <span class="kpi-value">{{ datos.empresas_activas }}</span>
          <span class="kpi-sub text-success">+{{ datos.empresas_nuevas_mes }} este mes</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Ingresos del año</span>
          <span class="kpi-value">{{ datos.ingresos_anio | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="kpi-sub" [class.text-success]="datos.variacion_ingresos_anio >= 0" [class.text-danger]="datos.variacion_ingresos_anio < 0">
            {{ datos.variacion_ingresos_anio >= 0 ? '+' : '' }}{{ datos.variacion_ingresos_anio }}% vs anterior
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Ingresos del mes</span>
          <span class="kpi-value">{{ datos.ingresos_mes | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="kpi-sub" [class.text-success]="datos.variacion_ingresos_mes >= 0" [class.text-danger]="datos.variacion_ingresos_mes < 0">
            {{ datos.variacion_ingresos_mes >= 0 ? '+' : '' }}{{ datos.variacion_ingresos_mes }}% vs anterior
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Usuarios nuevos</span>
          <span class="kpi-value">{{ datos.usuarios_nuevos_mes }}</span>
          <span class="kpi-sub text-muted">este mes</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Crecimiento Neto</span>
          <span class="kpi-value" [class.text-success]="datos.crecimiento_neto >= 0" [class.text-danger]="datos.crecimiento_neto < 0">
            {{ datos.crecimiento_neto > 0 ? '+' : '' }}{{ datos.crecimiento_neto }}
          </span>
          <span class="kpi-sub text-muted">empresas (Neto)</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Tasa de crecimiento</span>
          <span class="kpi-value text-success">{{ datos.tasa_crecimiento }}%</span>
          <span class="kpi-sub text-muted">mensual</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Tasa de abandono</span>
          <span class="kpi-value text-danger">{{ datos.tasa_abandono }}%</span>
          <span class="kpi-sub text-muted">de usuarios</span>
        </div>
        <div class="kpi-card kpi-warning">
          <span class="kpi-label">Zona upgrade</span>
          <span class="kpi-value">{{ datos.zona_upgrade }}</span>
          <span class="kpi-sub text-warning">empresas</span>
        </div>
        <div class="kpi-card kpi-danger">
          <span class="kpi-label">Zona de rescate</span>
          <span class="kpi-value">{{ datos.zona_rescate }}</span>
          <span class="kpi-sub text-danger">empresas</span>
        </div>
      </div>

      <!-- Gráficas row -->
    <div class="row g-4 mb-4">
        <!-- Donut: rescate vs upgrade -->
        <div class="col-md-4">
          <div class="card-graf">
            <h6 class="graf-title">Zonas críticas</h6>
            <div class="donut-wrap">
              <div class="donut" [style.background]="donutGlobal()"></div>
              <div class="donut-legend">
                <span class="dot dot-danger"></span> Rescate ({{ datos.zona_rescate }})
                <span class="dot dot-warning ms-3"></span> Upgrade ({{ datos.zona_upgrade }})
              </div>
            </div>
          </div>
        </div>
        <!-- Barras: planes más vendidos -->
        <div class="col-md-4">
          <div class="card-graf">
            <h6 class="graf-title">Planes más vendidos</h6>
            <div class="bar-chart">
              <div *ngFor="let p of datos.planes_mas_vendidos" class="bar-row">
                <span class="bar-label">{{ p.plan }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-primary" [style.width.%]="barPct(p.ventas, maxPlanVentas)"></div>
                </div>
                <span class="bar-val">{{ p.ventas }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Barras: top vendedores -->
        <div class="col-md-4">
          <div class="card-graf">
            <h6 class="graf-title">Top vendedores</h6>
            <div class="bar-chart">
              <div *ngFor="let v of datos.top_vendedores | slice:0:5" class="bar-row">
                <span class="bar-label">{{ v.vendedor.split(' ')[0] }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-success" [style.width.%]="barPct(v.ingresos_generados, maxVendedorIngresos)"></div>
                </div>
                <span class="bar-val">{{ v.ingresos_generados | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla: Zona de Rescate -->
      <div class="card-tabla">
        <div class="tabla-header">
          <span><i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>Zona de Rescate ({{ datos.zona_rescate }})</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plan Vencido</th>
                <th>Ult. Intento acceso</th>
                <th>Venció</th>
                <th>Correo empresa</th>
                <th>Telefono empresa</th>
                <th>Dead line</th>
                <th class="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of datos.empresas_rescate">
                <td>
                  <div class="d-flex align-items-center gap-1">
                    <span class="empresa-tooltip">{{ e.nombre_empresa }}</span>
                    <app-info-tooltip
                      [message]="getTooltipRescate(e)"
                      icon="bi-info-circle">
                    </app-info-tooltip>
                  </div>
                </td>
                <td><span class="badge-plan">{{ e.plan_nombre }}</span></td>
                <td class="text-muted small">{{ e.ultimo_acceso_fmt }}</td>
                <td class="text-muted small">{{ formatVencimiento(e.fecha_vencimiento) }}</td>
                <td class="small">{{ e.email || '—' }}</td>
                <td class="small">{{ e.telefono || '—' }}</td>
                <td>
                  <span class="badge-deadline" [ngClass]="deadlineClass(e.deadline_fmt)">
                    {{ e.deadline_fmt }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="d-flex justify-content-center gap-1">
                    <button class="btn-accion btn-reactivar" (click)="reactivarEmpresa(e)" title="Reactivar/Eliminar">
                        <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="btn-accion btn-eliminar" (click)="eliminarEmpresa(e)" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="datos.empresas_rescate.length === 0">
                <td colspan="8" class="text-center text-muted py-4">Sin empresas en zona de rescate</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Reactivación (fuera del bloque *ngIf="datos") -->
    <div class="modal-overlay" *ngIf="modalReactivar.visible" (click)="cerrarModal()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <span class="modal-title"><i class="bi bi-arrow-repeat me-2 text-success"></i>Reactivar empresa</span>
          <button class="modal-close" (click)="cerrarModal()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <p class="modal-empresa">{{ modalReactivar.empresa?.nombre_empresa }}</p>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label-sm">Plan *</label>
              <select class="form-select form-select-sm" [(ngModel)]="modalReactivar.plan_id" (change)="onPlanChange()">
                <option value="">Seleccione un plan...</option>
                <option *ngFor="let p of planesDisponibles" [value]="p.id">{{ p.nombre }} — {{ p.precio_anual | currency:'USD':'symbol':'1.0-0' }}/año</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label-sm">Monto cobrado *</label>
              <input type="number" class="form-control form-control-sm" [(ngModel)]="modalReactivar.monto" placeholder="0.00" min="0">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label-sm">Método de pago *</label>
              <select class="form-select form-select-sm" [(ngModel)]="modalReactivar.metodo_pago">
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia bancaria</option>
                <option value="TARJETA">Tarjeta de crédito/débito</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label-sm">N° Comprobante</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="modalReactivar.numero_comprobante" placeholder="Opcional">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label-sm">Fecha inicio período</label>
              <input type="date" class="form-control form-control-sm" [(ngModel)]="modalReactivar.fecha_inicio">
            </div>
            <div class="form-group">
              <label class="form-label-sm">Fecha fin período</label>
              <input type="date" class="form-control form-control-sm" [(ngModel)]="modalReactivar.fecha_fin">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label-sm">Observaciones</label>
            <textarea class="form-control form-control-sm" [(ngModel)]="modalReactivar.observaciones" rows="2" placeholder="Motivo de reactivación..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-modal-cancel" (click)="cerrarModal()">Cancelar</button>
          <button class="btn-modal-confirm" (click)="confirmarReactivacion()" [disabled]="loadingReactivar || !modalReactivar.plan_id || !modalReactivar.monto">
            <span *ngIf="loadingReactivar" class="spinner-border spinner-border-sm me-1"></span>
            <i *ngIf="!loadingReactivar" class="bi bi-check-circle me-1"></i>
            {{ loadingReactivar ? 'Procesando...' : 'Confirmar Reactivación' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Eliminar empresa (placeholder) -->
    <div class="modal-overlay" *ngIf="modalEliminar.visible" (click)="cerrarModalEliminar()">
      <div class="modal-panel" style="width:420px" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <span class="modal-title"><i class="bi bi-trash me-2 text-danger"></i>Eliminar empresa</span>
          <button class="modal-close" (click)="cerrarModalEliminar()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <p style="font-size:0.85rem; color:#374151;">¿Estás seguro de que deseas eliminar a <strong>{{ modalEliminar.empresa?.nombre_empresa }}</strong>?</p>
          <p style="font-size:0.8rem; color:#6b7280;">Esta acción está en construcción y no realizará cambios por ahora.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-modal-cancel" (click)="cerrarModalEliminar()">Cancelar</button>
          <button class="btn-modal-confirm" style="background:#ef4444" disabled>
            <i class="bi bi-trash me-1"></i> Eliminar (próximamente)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }
    .section-title { font-size: 1.1rem; font-weight: 700; color: #161d35; margin: 0; }
    .section-sub { color: #64748b; font-size: 0.85rem; margin: 0.25rem 0 0; }
    .btn-generar { padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-pdf { padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-generar:disabled, .btn-pdf:disabled { opacity: 0.5; cursor: not-allowed; }
    .filtros-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 1rem; }
    .form-label-sm { font-size: 0.75rem; font-weight: 600; color: #374151; display: block; margin-bottom: 0.25rem; }
    .form-select-sm, .form-control-sm { font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid #d1d5db; }
    .rango-preview { color: #64748b; font-size: 0.8rem; }
    .empty-state, .loading-state { text-align: center; padding: 3rem 1rem; color: #64748b; }
    .empty-state i, .loading-state i { font-size: 2rem; margin-bottom: 1rem; }
    .spinner-grow { width: 2rem; height: 2rem; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 4px; padding: 0.75rem; background: #f8fafc; }
    .kpi-label { font-size: 0.6rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 0.25rem; }
    .kpi-value { font-size: 1.1rem; font-weight: 800; color: #161d35; display: block; }
    .kpi-sub { font-size: 0.7rem; color: #64748b; }
    .kpi-warning { border-left: 3px solid #f59e0b; }
    .kpi-danger { border-left: 3px solid #ef4444; }
    .card-graf { border: 1px solid #e2e8f0; border-radius: 4px; padding: 1rem; background: #f8fafc; }
    .graf-title { font-size: 0.85rem; font-weight: 700; color: #161d35; margin-bottom: 0.75rem; }
    .donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .donut { width: 80px; height: 80px; border-radius: 50%; }
    .donut-legend { font-size: 0.7rem; text-align: center; }
    .dot { display: inline-block; width: 0.5rem; height: 0.5rem; border-radius: 50%; margin-right: 0.25rem; vertical-align: middle; }
    .dot-danger { background: #ef4444; }
    .dot-warning { background: #f59e0b; }
    .bar-chart { display: flex; flex-direction: column; gap: 0.5rem; }
    .bar-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; }
    .bar-label { width: 60px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-track { flex: 1; height: 1.5rem; background: #e2e8f0; border-radius: 3px; position: relative; }
    .bar-fill { height: 100%; border-radius: 3px; }
    .bar-val { width: 50px; text-align: right; font-weight: 600; }
    .card-tabla { border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
    .tabla-header { background: #f1f5f9; padding: 0.75rem 1rem; font-weight: 700; font-size: 0.8rem; color: #475569; border-bottom: 1px solid #e2e8f0; }
    table { margin-bottom: 0; }
    th { background: #f1f5f9; padding: 0.6rem 0.75rem; font-size: 0.7rem; text-transform: uppercase; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.8rem; }
    tbody tr:nth-child(even) td { background: #fafbfc; }
    .badge-plan { background: #dbeafe; color: #1e40af; padding: 0.2rem 0.4rem; border-radius: 3px; font-size: 0.7rem; font-weight: 600; }
    .empresa-tooltip { cursor: help; color: #3b82f6; font-weight: 600; }
    .btn-accion { padding: 0.25rem; background: none; border: none; cursor: pointer; font-size: 0.9rem; }
    .btn-reactivar { color: #10b981; }
    .btn-eliminar { color: #ef4444; }
    .badge-deadline { padding: 0.2rem 0.4rem; border-radius: 3px; font-size: 0.7rem; font-weight: 600; }
    .deadline-urgent { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .deadline-warning { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .deadline-ok { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .modal-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; width: 520px; max-width: 95vw; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; }
    .modal-title { font-size: 0.9rem; font-weight: 700; color: #161d35; }
    .modal-close { background: none; border: none; cursor: pointer; color: #64748b; font-size: 1rem; }
    .modal-body { padding: 1.25rem; }
    .modal-empresa { font-size: 0.85rem; font-weight: 700; color: #3b82f6; margin-bottom: 1rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.75rem 1.25rem; border-top: 1px solid #e2e8f0; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
    .btn-modal-cancel { padding: 0.4rem 1rem; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem; }
    .btn-modal-confirm { padding: 0.4rem 1.25rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem; }
    .btn-modal-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class R031GlobalComponent implements OnInit, OnDestroy {

  datos: ReporteGlobal | null = null;
  loading = false;
  loadingPDF = false;
  loadingReactivar = false;

  // Modal reactivación
  modalReactivar = {
    visible: false,
    empresa: null as any,
    plan_id: '',
    monto: null as number | null,
    metodo_pago: 'TRANSFERENCIA',
    numero_comprobante: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1) - 86400000).toISOString().split('T')[0],
    observaciones: ''
  };
  planesDisponibles: any[] = [];

  // Modal eliminar
  modalEliminar = {
    visible: false,
    empresa: null as any
  };

  rangoTipo: RangoTipo = 'mes_actual';
  mesFiltro = new Date().getMonth() + 1;
  anioFiltro = new Date().getFullYear();
  fechaInicio = '';
  fechaFin = '';

  anioActual = new Date().getFullYear();
  meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private uiService: UiService,
    private cd: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.onRangoChange();
    this.generar();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRangoChange() {
    const now = new Date();
    switch (this.rangoTipo) {
      case 'mes_actual':
        this.fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        this.fechaFin = now.toISOString().split('T')[0];
        break;
      case 'mes_anterior': {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        this.fechaInicio = prev.toISOString().split('T')[0];
        this.fechaFin = prevEnd.toISOString().split('T')[0];
        break;
      }
      case 'anio_actual':
        this.fechaInicio = `${now.getFullYear()}-01-01`;
        this.fechaFin = now.toISOString().split('T')[0];
        break;
      case 'mes_especifico': {
        const y = this.anioFiltro, m = this.mesFiltro;
        this.fechaInicio = `${y}-${String(m).padStart(2,'0')}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        this.fechaFin = `${y}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
        break;
      }
      case 'anio_especifico':
        this.fechaInicio = `${this.anioFiltro}-01-01`;
        this.fechaFin = `${this.anioFiltro}-12-31`;
        break;
    }
  }

  generar() {
    this.loading = true;
    this.reportesService.getReporteGlobal({ fecha_inicio: this.fechaInicio, fecha_fin: this.fechaFin })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.datos = data; this.loading = false; this.cd.detectChanges(); },
        error: (err) => { this.loading = false; this.uiService.showError(err, 'Error al cargar reporte global'); this.cd.detectChanges(); }
      });
  }

  exportarPDF() {
    this.loadingPDF = true;
    this.uiService.showToast('Generando Reporte Global...', 'info', 'Esto puede tardar unos segundos', 8000);
    this.cd.detectChanges();

    this.reportesService.exportarPDF('SUPERADMIN_GLOBAL', {
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_global_${new Date().getTime()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.uiService.showToast('PDF generado exitosamente', 'success', 'El archivo ha sido descargado', 4000);
      },
      error: (err) => {
        console.error('Error exportando PDF:', err);
        this.uiService.showError(err, 'Error al generar PDF');
      }
    }).add(() => {
      this.loadingPDF = false;
      this.cd.detectChanges();
    });
  }

  get maxPlanVentas(): number {
    return Math.max(...(this.datos?.planes_mas_vendidos.map(p => p.ventas) ?? [1]));
  }

  get maxVendedorIngresos(): number {
    return Math.max(...(this.datos?.top_vendedores.map(v => v.ingresos_generados) ?? [1]));
  }

  barPct(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  donutGlobal(): string {
    if (!this.datos) return '#e2e8f0';
    const total = (this.datos.zona_rescate + this.datos.zona_upgrade) || 1;
    const pctRescate = Math.round((this.datos.zona_rescate / total) * 100);
    return `conic-gradient(#ef4444 0% ${pctRescate}%, #f59e0b ${pctRescate}% 100%)`;
  }

  deadlineClass(fmt: string | undefined): string {
    if (!fmt) return '';
    const text = fmt.toLowerCase();
    if (text.includes('vencido') || text.includes('hora') || text.includes(' hoy')) return 'deadline-urgent';
    if (text.includes('días')) {
      const days = parseInt(text.split(' ')[0]);
      if (days < 3) return 'deadline-urgent';
      if (days < 8) return 'deadline-warning';
    }
    return 'deadline-ok';
  }

  formatVencimiento(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays >= 0 && diffDays < 31) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    return d.toLocaleDateString('es-EC', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  getTooltipRescate(e: any): string {
    return `Vendedor: ${e.vendedor_nombre || 'N/A'} | Antigüedad: ${e.antiguedad || 'N/A'} | Rep: ${e.representante || 'N/A'}`;
  }

  reactivarEmpresa(e: any) {
    this.modalReactivar.empresa = e;
    this.modalReactivar.plan_id = '';
    this.modalReactivar.monto = null;
    this.modalReactivar.metodo_pago = 'TRANSFERENCIA';
    this.modalReactivar.numero_comprobante = '';
    this.modalReactivar.observaciones = '';
    this.modalReactivar.fecha_inicio = new Date().toISOString().split('T')[0];
    const fin = new Date(); fin.setFullYear(fin.getFullYear() + 1); fin.setDate(fin.getDate() - 1);
    this.modalReactivar.fecha_fin = fin.toISOString().split('T')[0];
    this.modalReactivar.visible = true;
    this.cd.detectChanges();
    // Cargar planes si no están cargados
    if (!this.planesDisponibles.length) {
      this.http.get<any>(`${environment.apiUrl}/suscripciones/planes`).subscribe({
        next: (res) => { this.planesDisponibles = res.data || []; this.cd.detectChanges(); },
        error: () => { this.planesDisponibles = []; }
      });
    }
  }

  onPlanChange() {
    const plan = this.planesDisponibles.find(p => p.id === this.modalReactivar.plan_id);
    if (plan) this.modalReactivar.monto = plan.precio_anual;
  }

  cerrarModal() {
    this.modalReactivar.visible = false;
    this.modalReactivar.empresa = null;
  }

  confirmarReactivacion() {
    if (!this.modalReactivar.plan_id || !this.modalReactivar.monto) return;
    this.loadingReactivar = true;
    const empresaId = this.modalReactivar.empresa?.id;
    const payload = {
      plan_id: this.modalReactivar.plan_id,
      monto: this.modalReactivar.monto,
      metodo_pago: this.modalReactivar.metodo_pago,
      numero_comprobante: this.modalReactivar.numero_comprobante || null,
      fecha_inicio_periodo: this.modalReactivar.fecha_inicio ? new Date(this.modalReactivar.fecha_inicio).toISOString() : null,
      fecha_fin_periodo: this.modalReactivar.fecha_fin ? new Date(this.modalReactivar.fecha_fin).toISOString() : null,
      observaciones: this.modalReactivar.observaciones || null
    };
    this.http.post<any>(`${environment.apiUrl}/suscripciones/${empresaId}/reactivar`, payload).subscribe({
      next: (res) => {
        this.loadingReactivar = false;
        this.uiService.showToast('Empresa reactivada', 'success', res.data?.mensaje || 'Acceso restaurado correctamente');
        this.cerrarModal();
        this.generar(); // Recargar el reporte
        this.cd.detectChanges();
      },
      error: (err) => {
        this.loadingReactivar = false;
        this.uiService.showError(err, 'Error al reactivar empresa');
        this.cd.detectChanges();
      }
    });
  }

  eliminarEmpresa(e: any) {
    this.modalEliminar.empresa = e;
    this.modalEliminar.visible = true;
    this.cd.detectChanges();
  }

  cerrarModalEliminar() {
    this.modalEliminar.visible = false;
    this.modalEliminar.empresa = null;
  }
}
