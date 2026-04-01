import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RenovacionesApiService } from '../../../core/api/renovaciones-api.service';
import { SolicitudRenovacion, SolicitudRenovacionCreate } from '../../../domain/models/renovacion.model';
import { VendedorEmpresaService } from '../empresas/services/vendedor-empresa.service';
import { UiService } from '../../../shared/services/ui.service';
import { finalize, Subject, takeUntil } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-renovaciones-vendedor',
  template: `
    <div class="container-fluid p-4">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-header bg-white border-0 p-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0 fw-bold">Seguimiento de Renovaciones</h5>
              <p class="text-muted small mb-0">Estado de renovaciones de tus empresas asignadas</p>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary rounded-3 d-flex align-items-center gap-2" 
                      [class.btn-primary]="verHistorial"
                      [class.text-white]="verHistorial"
                      (click)="toggleHistorial()">
                <i class="bi" [ngClass]="verHistorial ? 'bi-journal-check' : 'bi-journal-text'"></i>
                <span class="d-none d-sm-inline">{{ verHistorial ? 'Viendo Historial' : 'Ver Historial' }}</span>
              </button>
              <button class="btn btn-primary rounded-3 px-4 shadow-sm fw-bold" (click)="abrirModalNuevaSolicitud()">
                <i class="bi bi-plus-lg me-2"></i> Nueva Solicitud
              </button>
              <button class="btn btn-light rounded-3" (click)="cargarSolicitudes()">
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Empresa</th>
                  <th class="py-3">Plan Solicitado</th>
                  <th class="py-3">Fecha Solicitud</th>
                  <th class="py-3 text-center">Estado</th>
                  <th class="pe-4 py-3 text-end">Procesado el</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of solicitudes" [class.table-highlighted]="s.id === highlightedId">
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <div class="avatar-sm bg-primary-subtle text-primary me-3">
                        {{ (s.empresa_nombre?.charAt(0) || 'E') }}
                      </div>
                      <span class="fw-bold">{{ s.empresa_nombre }}</span>
                    </div>
                  </td>
                  <td><span class="fw-medium">{{ s.plan_nombre }}</span></td>
                  <td>{{ s.fecha_solicitud | date:'short' }}</td>
                  <td class="text-center">
                    <span class="badge rounded-pill" [ngClass]="getEstadoClass(s.estado)">
                      {{ s.estado }}
                    </span>
                  </td>
                  <td class="pe-4 text-end">
                    <span *ngIf="s.estado !== 'PENDIENTE'" class="text-muted small">
                      {{ (s.fecha_procesamiento || s.updated_at) | date:'shortDate' }}
                    </span>
                    <span *ngIf="s.estado === 'PENDIENTE'" class="text-muted small italic">Aún en revisión</span>
                  </td>
                </tr>
                <tr *ngIf="solicitudes.length === 0">
                  <td colspan="5" class="text-center py-5">
                    <p class="text-muted py-5">No hay renovaciones en curso</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Nueva Solicitud (Vendedor Side) -->
    <div class="modal fade" id="modalVendedorRenovacion" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow rounded-4">
          <div class="modal-header border-0 p-4 pb-0">
            <h5 class="modal-title fw-bold">Tramitar Renovación</h5>
            <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-muted mb-4 subtitle small">Como vendedor, puedes solicitar la renovación de una empresa que gestionas enviando el comprobante de pago.</p>
            
            <div class="mb-3">
              <label class="form-label fw-bold small">1. Seleccionar Empresa</label>
              <select class="form-select border-0 bg-light p-3 rounded-3 shadow-none" 
                      [(ngModel)]="nuevaSolicitud.empresa_id"
                      (change)="onEmpresaChange()">
                <option value="" disabled selected>Selecciona una empresa...</option>
                <option *ngFor="let e of empresas" [value]="e.id">{{ e.razonSocial }} ({{ e.ruc }})</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold small">2. Seleccionar Plan de Renovación</label>
              <select class="form-select border-0 bg-light p-3 rounded-3 shadow-none" 
                      [(ngModel)]="nuevaSolicitud.plan_id"
                      [disabled]="!nuevaSolicitud.empresa_id">
                <option value="" disabled selected>{{ !nuevaSolicitud.empresa_id ? 'Primero selecciona una empresa...' : 'Selecciona un plan...' }}</option>
                <option *ngFor="let p of planes" 
                        [value]="p.id" 
                        [disabled]="p.id === selectedEmpresaPlanId">
                  {{ p.nombre }} - {{ p.precio_anual | currency }}/año
                  <span *ngIf="p.id === selectedEmpresaPlanId"> (Plan Actual)</span>
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold small">3. URL Comprobante de Pago</label>
              <input type="text" class="form-control border-0 bg-light p-3 rounded-3 shadow-none" 
                     placeholder="Enlace al comprobante (PDF/Imagen)"
                     [(ngModel)]="nuevaSolicitud.comprobante_url">
            </div>

            <div class="alert alert-warning border-0 rounded-3 smallest mb-0">
               <i class="bi bi-exclamation-triangle-fill me-2"></i> La solicitud será revisada por el Superadmin para su activación definitiva.
            </div>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <button type="button" class="btn btn-light px-4 py-2 rounded-3" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary px-4 py-2 rounded-3 fw-bold" 
                    [disabled]="!nuevaSolicitud.empresa_id || !nuevaSolicitud.plan_id || cargando"
                    (click)="enviarSolicitud()">
              <span *ngIf="cargando" class="spinner-border spinner-border-sm me-2"></span>
              Enviar Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle (Solo Lectura para Vendedor) -->
    <div class="modal fade" id="modalVendedorDetalle" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0 p-4 pb-0">
             <h5 class="fw-bold">Detalle de Renovación</h5>
             <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4" *ngIf="seleccionada">
            <div class="mb-4">
              <label class="small text-muted d-block uppercase tracking-wider fw-bold mb-1">EMPRESA</label>
              <h6 class="fw-bold mb-0">{{ seleccionada.empresa_nombre }}</h6>
            </div>
            
            <div class="row mb-4">
              <div class="col-6">
                <label class="small text-muted d-block uppercase tracking-wider fw-bold mb-1">PLAN SOLICITADO</label>
                <span class="fw-medium">{{ seleccionada.plan_nombre }}</span>
              </div>
              <div class="col-6">
                <label class="small text-muted d-block uppercase tracking-wider fw-bold mb-1">ESTADO</label>
                <span class="badge rounded-pill" [ngClass]="getEstadoClass(seleccionada.estado)">{{ seleccionada.estado }}</span>
              </div>
            </div>

            <div class="mb-4" *ngIf="seleccionada.estado === 'RECHAZADA' && seleccionada.motivo_rechazo">
              <label class="small text-danger d-block uppercase tracking-wider fw-bold mb-1">MOTIVO RECHAZO</label>
              <div class="p-3 bg-danger-subtle rounded-3 small">
                {{ seleccionada.motivo_rechazo }}
              </div>
            </div>

            <div class="mb-0" *ngIf="seleccionada.comprobante_url">
               <label class="small text-muted d-block uppercase tracking-wider fw-bold mb-1">COMPROBANTE</label>
               <a [href]="seleccionada.comprobante_url" target="_blank" class="d-flex align-items-center p-3 border rounded-3 text-primary text-decoration-none bg-light-subtle">
                 <i class="bi bi-file-earmark-image fs-4 me-3"></i>
                 <div class="flex-grow-1 overflow-hidden">
                   <span class="d-block text-truncate fw-medium">Ver comprobante adjunto</span>
                   <span class="smallest text-muted">Abre en una pestaña nueva</span>
                 </div>
               </a>
            </div>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <button class="btn btn-light px-4 py-2 w-100 rounded-3 fw-bold" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .avatar-sm { width: 38px; height: 38px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .badge { padding: 0.5em 1em; font-weight: 600; }
    .bg-primary-subtle { background-color: #e0f2fe !important; }
    .bg-success-subtle { background-color: #dcfce7 !important; }
    .bg-warning-subtle { background-color: #fef9c3 !important; }
    .bg-danger-subtle { background-color: #fee2e2 !important; }
    .subtitle { font-size: 0.85rem; }
    .smallest { font-size: 0.75rem; }
    .table-highlighted {
      background-color: #f0f9ff !important;
      border-left: 4px solid #0ea5e9;
    }
  `],
  standalone: false
})
export class RenovacionesVendedorPage implements OnInit, OnDestroy {
  solicitudes: SolicitudRenovacion[] = [];
  empresas: any[] = [];
  planes: any[] = [];
  nuevaSolicitud: SolicitudRenovacionCreate = {
    empresa_id: '',
    plan_id: '',
    comprobante_url: ''
  };
  seleccionada: SolicitudRenovacion | null = null;
  cargando: boolean = false;
  highlightedId: string | null = null;
  verHistorial: boolean = false;
  selectedEmpresaPlanId: string | null = null;
  
  private lastOpenedId: string | null = null;
  private destroy$ = new Subject<void>();
  private modalNueva: any;
  private modalDetalle: any;

  constructor(
    private api: RenovacionesApiService,
    private vendedorService: VendedorEmpresaService,
    private uiService: UiService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. Listen to global data and cache
    this.api.solicitudes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.solicitudes = data;
        this.cd.detectChanges();
      });

    // 2. Initial load
    this.cargarSolicitudes();
    this.cargarEmpresas();
    this.cargarPlanes();

    // 3. Listen to query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id'] && params['id'] !== this.highlightedId) {
          this.highlightedId = params['id'];
          this.lastOpenedId = null;
          this.checkHighlight(this.solicitudes);
        } else if (!params['id']) {
          this.highlightedId = null;
          this.lastOpenedId = null;
        }
      });
  }

  private checkHighlight(data: SolicitudRenovacion[]) {
    if (!this.highlightedId || data.length === 0) return;
    
    if (this.highlightedId !== this.lastOpenedId) {
      const found = data.find(s => s.id === this.highlightedId);
      if (found) {
        this.lastOpenedId = this.highlightedId;
        setTimeout(() => this.abrirDetalle(found), 800);
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarSolicitudes() {
    this.api.listarSolicitudes(this.verHistorial).subscribe();
  }

  toggleHistorial() {
    this.verHistorial = !this.verHistorial;
    this.cargarSolicitudes();
  }

  cargarEmpresas() {
    this.vendedorService.loadMyEmpresas(true);
    this.vendedorService.getEmpresas().subscribe(data => {
      this.empresas = data;
    });
  }

  onEmpresaChange() {
    this.nuevaSolicitud.plan_id = '';
    const emp = this.empresas.find(e => e.id === this.nuevaSolicitud.empresa_id);
    this.selectedEmpresaPlanId = emp ? emp.planId : null;
  }

  cargarPlanes() {
    this.vendedorService.getPlanes().subscribe(data => {
      this.planes = data;
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'bg-warning-subtle text-warning';
      case 'ACEPTADA': return 'bg-success-subtle text-success';
      case 'RECHAZADA': return 'bg-danger-subtle text-danger';
      default: return 'bg-light text-secondary';
    }
  }

  abrirModalNuevaSolicitud() {
    this.nuevaSolicitud = { empresa_id: '', plan_id: '', comprobante_url: '' };
    this.selectedEmpresaPlanId = null;
    const modalEl = document.getElementById('modalVendedorRenovacion');
    if (modalEl) {
      this.modalNueva = new bootstrap.Modal(modalEl);
      this.modalNueva.show();
    }
  }

  abrirDetalle(s: SolicitudRenovacion) {
    this.seleccionada = s;
    const modalEl = document.getElementById('modalVendedorDetalle');
    if (modalEl) {
      this.modalDetalle = new bootstrap.Modal(modalEl);
      this.modalDetalle.show();
    }
  }

  enviarSolicitud() {
    if (!this.nuevaSolicitud.empresa_id || !this.nuevaSolicitud.plan_id) return;
    
    this.cargando = true;
    this.api.solicitarRenovacion(this.nuevaSolicitud)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: () => {
          this.uiService.showToast('Solicitud enviada correctamente', 'success');
          this.modalNueva?.hide();
          this.cargarSolicitudes();
          // Reset
          this.nuevaSolicitud = { empresa_id: '', plan_id: '', comprobante_url: '' };
        },
        error: (err) => {
          this.uiService.showToast(err.error?.detail || 'Error al enviar solicitud', 'danger');
        }
      });
  }
}
