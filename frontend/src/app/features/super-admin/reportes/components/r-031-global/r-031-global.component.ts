import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import {
  ReportesService, ReporteGlobal, EmpresaZonaRescate
} from '../../services/reportes.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { environment } from '../../../../../../environments/environment';

// Sub-componentes fragmentados
import { R031KpisComponent } from './components/r031-kpis.component';
import { R031GraficasComponent } from './components/r031-graficas.component';
import { R031TablaRescateComponent } from './components/r031-tabla-rescate.component';
import { R031TablaUpgradeComponent } from './components/r031-tabla-upgrade.component';

type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'personalizado';

@Component({
  selector: 'app-r-031-global',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HttpClientModule,
    R031KpisComponent,
    R031GraficasComponent,
    R031TablaRescateComponent,
    R031TablaUpgradeComponent
  ],
  template: `
    <!-- Estado vacío/Loading -->
    <div class="empty-state" *ngIf="!datos && !loading">
      <i class="bi bi-graph-up-arrow"></i>
      <p>Configura los filtros y presiona <strong>Consultar</strong></p>
    </div>

    <div class="loading-state" *ngIf="loading">
      <div class="spinner-grow text-primary" role="status"></div>
      <p>Obteniendo datos del sistema...</p>
    </div>

    <div *ngIf="datos" id="print-global" class="report-content animate__animated animate__fadeIn">
      
      <!-- 1. KPIs Fragmentados -->
      <app-r031-kpis [datos]="datos"></app-r031-kpis>

      <!-- 2. Gráficas Fragmentadas -->
      <app-r031-graficas [datos]="datos"></app-r031-graficas>

      <!-- 3. Tabla Zona de Rescate -->
      <app-r031-tabla-rescate 
        [empresas]="datos.empresas_rescate"
        (onReactivar)="reactivarEmpresa($event)"
        (onEliminar)="eliminarEmpresa($event)">
      </app-r031-tabla-rescate>

      <!-- 4. Tabla Zona de Upgrade -->
      <app-r031-tabla-upgrade 
        [empresas]="datos.empresas_upgrade">
      </app-r031-tabla-upgrade>
      
    </div>

    <!-- Modales de Acción -->
    <!-- Modal Reactivación -->
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
              <label class="form-label-sm">Estado del pago *</label>
              <select class="form-select form-select-sm" [(ngModel)]="modalReactivar.estado">
                <option value="PAGADO">PAGADO (Confirmado)</option>
                <option value="PENDIENTE">PENDIENTE (Cobro posterior)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label-sm">Monto {{ modalReactivar.estado === 'PAGADO' ? 'cobrado' : 'a cobrar' }} *</label>
              <input type="number" class="form-control form-control-sm" [(ngModel)]="modalReactivar.monto" placeholder="0.00" min="0">
            </div>
            <!-- Mostrar Método solo si es PAGADO -->
            <div class="form-group" *ngIf="modalReactivar.estado === 'PAGADO'">
              <label class="form-label-sm">Método de pago *</label>
              <select class="form-select form-select-sm" [(ngModel)]="modalReactivar.metodo_pago">
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia bancaria</option>
                <option value="TARJETA">Tarjeta de crédito/débito</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          <!-- Mostrar Comprobante solo si es PAGADO -->
          <div class="form-row" *ngIf="modalReactivar.estado === 'PAGADO'">
            <div class="form-group">
              <label class="form-label-sm">N° Comprobante *</label>
              <input type="text" class="form-control form-control-sm"
                [(ngModel)]="modalReactivar.numero_comprobante"
                [class.is-invalid]="(comprobanteTouched || reactivarSubmitted) && modalReactivar.estado === 'PAGADO' && !modalReactivar.numero_comprobante"
                (blur)="comprobanteTouched = true"
                placeholder="Ej: TR-000123">
              <div class="invalid-feedback" style="font-size:0.75rem;"
                *ngIf="(comprobanteTouched || reactivarSubmitted) && modalReactivar.estado === 'PAGADO' && !modalReactivar.numero_comprobante">
                El N° Comprobante es obligatorio.
              </div>
            </div>
            <div class="form-group" style="visibility: hidden;"> <!-- Space keeping -->
              <label class="form-label-sm">Space</label>
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
          <button class="btn-modal-confirm" (click)="confirmarReactivacion()"
            [disabled]="loadingReactivar || !modalReactivar.plan_id || !modalReactivar.monto || (modalReactivar.estado === 'PAGADO' && !modalReactivar.numero_comprobante)">
            <span *ngIf="loadingReactivar" class="spinner-border spinner-border-sm me-1"></span>
            <i *ngIf="!loadingReactivar" class="bi bi-check-circle me-1"></i>
            {{ loadingReactivar ? 'Procesando...' : 'Confirmar Reactivación' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Eliminar empresa -->
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
    .report-content { padding: 0.5rem; }
    .empty-state, .loading-state { text-align: center; padding: 4rem 1rem; color: #64748b; background: white; border-radius: 12px; border: 2px dashed #e2e8f0; margin: 2rem 0; }
    .empty-state i { font-size: 2.5rem; margin-bottom: 1rem; color: #94a3b8; }
    .spinner-grow { width: 2.5rem; height: 2.5rem; margin-bottom: 1rem; }
    
    /* Reutilización de estilos para modales */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-panel { background: #fff; border-radius: 12px; width: 520px; max-width: 95vw; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; border-bottom: 1px solid #f1f5f9; }
    .modal-title { font-size: 1rem; font-weight: 700; color: #1e293b; }
    .modal-close { background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 1.25rem; }
    .modal-body { padding: 1.5rem; }
    .modal-empresa { font-size: 1.1rem; font-weight: 800; color: #3b82f6; margin-bottom: 1.25rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; background: #f8fafc; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-label-sm { font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; }
    .form-select-sm, .form-control-sm { border-radius: 6px; border: 1px solid #e2e8f0; padding: 0.5rem; font-size: 0.85rem; }
    
    .btn-modal-cancel { padding: 0.5rem 1.25rem; background: #fff; color: #64748b; border: 1px solid #e2e8f0; border-radius: 6px; font-weight: 600; font-size: 0.85rem; }
    .btn-modal-confirm { padding: 0.5rem 1.5rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 0.85rem; }
    .btn-modal-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class R031GlobalComponent implements OnInit, OnDestroy {

  datos: ReporteGlobal | null = null;
  loading = false;
  loadingPDF = false;
  loadingReactivar = false;
  comprobanteTouched = false;
  reactivarSubmitted = false;

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
    estado: 'PAGADO',
    observaciones: ''
  };
  planesDisponibles: any[] = [];

  // Modal eliminar
  modalEliminar = {
    visible: false,
    empresa: null as any
  };

  rangoTipo: RangoTipo = 'mes_actual';
  fechaInicio = '';
  fechaFin = '';

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private uiService: UiService,
    private cd: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  generar() {
    this.loading = true;
    this.reportesService.getReporteGlobal({ fecha_inicio: this.fechaInicio, fecha_fin: this.fechaFin })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { 
          this.datos = data; 
          this.loading = false; 
          this.cd.detectChanges(); 
        },
        error: (err) => { 
          this.loading = false; 
          this.uiService.showError(err, 'Error al cargar reporte global'); 
          this.cd.detectChanges(); 
        }
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

  // --- Lógica de Modales (Manejada por el controlador padre) ---

  reactivarEmpresa(e: EmpresaZonaRescate) {
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
    this.comprobanteTouched = false;
    this.reactivarSubmitted = false;
    this.cd.detectChanges();

    if (!this.planesDisponibles.length) {
      this.http.get<any>(`${environment.apiUrl}/suscripciones/planes`).subscribe({
        next: (res) => { this.planesDisponibles = res.detalles || []; this.cd.detectChanges(); },
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
    this.reactivarSubmitted = true;
    if (!this.modalReactivar.plan_id || !this.modalReactivar.monto) return;
    if (this.modalReactivar.estado === 'PAGADO' && !this.modalReactivar.numero_comprobante) return;
    this.loadingReactivar = true;
    const empresaId = this.modalReactivar.empresa?.id;
    const payload = {
      plan_id: this.modalReactivar.plan_id,
      monto: this.modalReactivar.monto,
      metodo_pago: this.modalReactivar.metodo_pago,
      numero_comprobante: this.modalReactivar.numero_comprobante || null,
      estado: this.modalReactivar.estado,
      fecha_inicio_periodo: this.modalReactivar.fecha_inicio ? new Date(this.modalReactivar.fecha_inicio).toISOString() : null,
      fecha_fin_periodo: this.modalReactivar.fecha_fin ? new Date(this.modalReactivar.fecha_fin).toISOString() : null,
      observaciones: this.modalReactivar.observaciones || null
    };
    this.http.post<any>(`${environment.apiUrl}/suscripciones/${empresaId}/reactivar`, payload).subscribe({
      next: (res) => {
        this.loadingReactivar = false;
        this.uiService.showToast('Empresa reactivada', 'success', res.detalles?.mensaje || 'Acceso restaurado correctamente');
        this.cerrarModal();
        this.generar();
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
