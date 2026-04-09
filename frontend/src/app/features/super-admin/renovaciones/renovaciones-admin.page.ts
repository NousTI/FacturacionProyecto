import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RenovacionesApiService } from '../../../core/api/renovaciones-api.service';
import { SolicitudRenovacion, EstadoRenovacion, SolicitudRenovacionProcess } from '../../../domain/models/renovacion.model';
import { finalize, map, Observable, Subject, takeUntil } from 'rxjs';
import { UiService } from '../../../shared/services/ui.service';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { UserRole } from '../../../domain/enums/role.enum';

declare var bootstrap: any;

@Component({
  selector: 'app-renovaciones-admin',
  template: `
    <div class="container-fluid p-4">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-header bg-white border-0 p-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0 fw-bold">{{ isVendedor ? 'Seguimiento de Renovaciones' : 'Gestión de Renovaciones' }}</h5>
              <p class="text-muted small mb-0">{{ isVendedor ? 'Tus empresas asignadas que están renovando' : 'Revisa y aprueba las solicitudes de las empresas' }}</p>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary rounded-3 d-flex align-items-center gap-2" 
                      [class.btn-primary]="verHistorial"
                      [class.text-white]="verHistorial"
                      (click)="toggleHistorial()">
                <i class="bi" [ngClass]="verHistorial ? 'bi-journal-check' : 'bi-journal-text'"></i>
                <span class="d-none d-sm-inline">{{ verHistorial ? 'Viendo Historial' : 'Ver Historial' }}</span>
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
                  <th class="py-3">Vendedor</th>
                  <th class="py-3">Fecha Solicitud</th>
                  <th class="py-3 text-center">Estado</th>
                  <th class="pe-4 py-3 text-end">Acciones</th>
                  <th class="pe-4 py-3 text-end">Fecha Procesada</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of solicitudes" [class.table-highlighted]="s.id === highlightedId">
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <div class="avatar-sm bg-primary-subtle text-primary me-3">
                        {{ (s.empresa_nombre?.charAt(0) || 'E') }}
                      </div>
                      <div>
                        <span class="fw-bold d-block">{{ s.empresa_nombre }}</span>
                        <span class="smallest text-muted">ID Sub: #{{ s.suscripcion_id.substring(0,8) }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="fw-medium">{{ s.plan_nombre }}</span>
                  </td>
                  <td>{{ s.vendedor_nombre || 'Sín Vendedor' }}</td>
                  <td>{{ s.fecha_solicitud | date:'short' }}</td>
                  <td class="text-center">
                    <span class="badge rounded-pill" [ngClass]="getEstadoClass(s.estado)">
                      {{ s.estado }}
                    </span>
                  </td>
                  <td class="pe-4 text-end">
                    <div class="btn-group rounded-3 overflow-hidden shadow-sm border" *ngIf="!isVendedor">
                       <button class="btn btn-white btn-sm px-3" (click)="abrirDetalle(s)" title="Ver Detalle">
                         <i class="bi bi-eye text-primary"></i>
                       </button>
                       <button *ngIf="s.estado === 'PENDIENTE'" class="btn btn-white btn-sm px-3 border-start" (click)="abrirRechazo(s)" title="Rechazar">
                         <i class="bi bi-x-lg text-danger"></i>
                       </button>
                    </div>
                  </td>
                  <td class="pe-4 text-end">
                    <span *ngIf="s.estado !== 'PENDIENTE'" class="text-muted small">
                      {{ (s.fecha_procesamiento || s.updated_at) | date:'short' }}
                    </span>
                    <span *ngIf="s.estado === 'PENDIENTE'" class="text-muted smallest text-uppercase fw-bold opacity-50">Pendiente</span>
                  </td>
                </tr>
                <tr *ngIf="solicitudes.length === 0">
                  <td colspan="7" class="text-center py-5">
                    <p class="text-muted py-5">No hay solicitudes para procesar</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle -->
    <div class="modal fade" id="modalDetalle" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0 p-4 pb-0">
             <h5 class="fw-bold">Detalle de Solicitud</h5>
             <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4" *ngIf="seleccionada">
            <div class="row g-4">
              <!-- Info Principal -->
              <div class="col-md-7">
                <div class="bg-light p-4 rounded-4 h-100">
                  <h6 class="text-uppercase smallest fw-800 text-muted mb-3">Información de la Empresa</h6>
                  <div class="d-flex align-items-center mb-3">
                    <div class="avatar-sm bg-primary text-white me-3">
                      {{ (seleccionada.empresa_nombre?.charAt(0) || 'E') }}
                    </div>
                    <div>
                      <h5 class="mb-0 fw-bold">{{ seleccionada.empresa_nombre }}</h5>
                      <span class="text-muted small">ID Empresa: {{ seleccionada.empresa_id }}</span>
                    </div>
                  </div>
                  
                  <div class="mt-4 pt-3 border-top">
                    <div class="row g-3">
                      <div class="col-6">
                        <label class="smallest text-muted text-uppercase d-block fw-bold">Plan Solicitado</label>
                        <span class="fw-bold text-dark">{{ seleccionada.plan_nombre }}</span>
                      </div>
                      <div class="col-6">
                        <label class="smallest text-muted text-uppercase d-block fw-bold">Estado Actual</label>
                        <span class="badge rounded-pill" [ngClass]="getEstadoClass(seleccionada.estado)">{{ seleccionada.estado }}</span>
                      </div>
                      <div class="col-6">
                        <label class="smallest text-muted text-uppercase d-block fw-bold">Fecha Solicitud</label>
                        <span class="text-dark small">{{ seleccionada.fecha_solicitud | date:'medium' }}</span>
                      </div>
                      <div class="col-6" *ngIf="seleccionada.fecha_procesamiento">
                        <label class="smallest text-muted text-uppercase d-block fw-bold">Fecha Proceso</label>
                        <span class="text-dark small">{{ seleccionada.fecha_procesamiento | date:'medium' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Info Secundaria -->
              <div class="col-md-5">
                <div class="h-100 d-flex flex-column gap-3">
                  <div class="bg-light p-3 rounded-4">
                    <label class="smallest text-muted text-uppercase d-block fw-bold mb-2">Vendedor</label>
                    <div class="d-flex align-items-center">
                      <i class="bi bi-person-badge text-corporate me-2"></i>
                      <span class="fw-bold small">{{ seleccionada.vendedor_nombre || 'Gestión Directa' }}</span>
                    </div>
                  </div>

                  <div class="bg-light p-3 rounded-4" *ngIf="seleccionada.comprobante_url">
                    <label class="smallest text-muted text-uppercase d-block fw-bold mb-2">Comprobante de Pago</label>
                    <a [href]="seleccionada.comprobante_url" target="_blank" class="btn btn-white w-100 text-start border rounded-3 d-flex align-items-center justify-content-between">
                      <span class="text-truncate small"><i class="bi bi-file-earmark-image me-2 text-primary"></i>Ver Adjunto</span>
                      <i class="bi bi-box-arrow-up-right smallest text-muted"></i>
                    </a>
                  </div>

                  <div class="bg-danger-subtle p-3 rounded-4" *ngIf="seleccionada.motivo_rechazo">
                    <label class="smallest text-danger text-uppercase d-block fw-bold mb-1">Motivo de Rechazo</label>
                    <p class="mb-0 small text-danger">{{ seleccionada.motivo_rechazo }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
             <button class="btn btn-light px-4 py-2" data-bs-dismiss="modal">Cerrar</button>
             <button *ngIf="seleccionada?.estado === 'PENDIENTE' && !isVendedor" 
                     class="btn btn-primary px-4 py-2 fw-bold" 
                     (click)="irAProcesar()">
               Procesar Solicitud
             </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Procesar (Aprobar) -->
    <div class="modal fade" id="modalAprobar" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0 p-4 pb-0">
             <h5 class="fw-bold">Aprobar Renovación</h5>
             <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4" *ngIf="seleccionada">
            <p>¿Estás seguro de que deseas aprobar la renovación para <strong>{{ seleccionada.empresa_nombre }}</strong>?</p>
            <div class="p-3 bg-light rounded-3 mb-3">
              <ul class="list-unstyled mb-0 small">
                <li><i class="bi bi-check2-circle text-success me-2"></i> Se extenderá la fecha 365 días.</li>
                <li><i class="bi bi-check2-circle text-success me-2"></i> Se registrará el pago anual.</li>
                <li><i class="bi bi-check2-circle text-success me-2"></i> Se generará la comisión al vendedor.</li>
              </ul>
            </div>
            <div *ngIf="seleccionada.comprobante_url" class="mb-3">
               <label class="small fw-bold mb-1">Comprobante:</label>
               <a [href]="seleccionada.comprobante_url" target="_blank" class="d-block p-2 border rounded-3 text-truncate">
                 <i class="bi bi-file-earmark-image me-2"></i> Ver adjunto
               </a>
            </div>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <div class="d-flex w-100 gap-2">
              <button class="btn btn-light px-4 py-2 flex-grow-1" data-bs-dismiss="modal">{{ (seleccionada?.estado === 'PENDIENTE') ? 'Cerrar' : 'Cerrar' }}</button>
              <ng-container *ngIf="seleccionada?.estado === 'PENDIENTE'">
                <button class="btn btn-outline-danger px-4 py-2" (click)="cerrarYRechazar()">Rechazar</button>
                <button class="btn btn-primary px-4 py-2 fw-bold" (click)="procesar('ACEPTADA')">Aprobar Ahora</button>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Rechazo -->
    <div class="modal fade" id="modalRechazar" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0 p-4 pb-0">
             <h5 class="fw-bold text-danger">Rechazar Solicitud</h5>
             <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <label class="form-label fw-bold small">Motivo del rechazo</label>
            <textarea class="form-control border-0 bg-light p-3 rounded-3" 
                      rows="3" 
                      placeholder="Indique la razón para que el usuario sea notificado"
                      [(ngModel)]="motivoRechazo"></textarea>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <button class="btn btn-light px-4 py-2" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-danger px-4 py-2 fw-bold" [disabled]="!motivoRechazo" (click)="procesar('RECHAZADA')">Confirmar Rechazo</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .avatar-sm {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    .badge { padding: 0.5em 1em; font-weight: 600; }
    .smallest { font-size: 0.7rem; }
    .bg-primary-subtle { background-color: #e0f2fe !important; }
    .bg-success-subtle { background-color: #dcfce7 !important; }
    .bg-warning-subtle { background-color: #fef9c3 !important; }
    .bg-danger-subtle { background-color: #fee2e2 !important; }
    .btn-white { background: white; border: none; }
    .btn-white:hover { background: #f8fafc; }
    .table-highlighted {
      background-color: #f0f9ff !important;
      border-left: 4px solid #0ea5e9;
    }
  `],
  standalone: false
})
export class RenovacionesAdminPage implements OnInit, OnDestroy {
  solicitudes: SolicitudRenovacion[] = [];
  seleccionada: SolicitudRenovacion | null = null;
  motivoRechazo: string = '';
  cargando: boolean = false;
  isVendedor: boolean = false;
  highlightedId: string | null = null;
  verHistorial: boolean = false;
  
  private destroy$ = new Subject<void>();
  private modalAprobar: any;
  private modalRechazar: any;
  private modalDetalle: any;

  constructor(
    private api: RenovacionesApiService,
    private uiService: UiService,
    private authFacade: AuthFacade,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {
    this.isVendedor = this.authFacade.getUserRole() === UserRole.VENDEDOR;
  }

  private lastOpenedId: string | null = null;

  ngOnInit() {
    // 1. Subscribe to data
    this.api.solicitudes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.solicitudes = data;
        this.checkHighlight(data);
        this.cd.detectChanges();
      });

    // 2. Initial load
    this.cargarSolicitudes();

    // 3. React to query params change
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id'] && params['id'] !== this.highlightedId) {
          this.highlightedId = params['id'];
          this.lastOpenedId = null; // Reset for new ID
          this.checkHighlight(this.solicitudes);
        } else if (!params['id']) {
          this.highlightedId = null;
          this.lastOpenedId = null;
        }
      });
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

  private checkHighlight(data: SolicitudRenovacion[]) {
    if (!this.highlightedId || data.length === 0) return;
    
    if (this.highlightedId !== this.lastOpenedId) {
      const found = data.find(s => s.id === this.highlightedId);
      if (found) {
        this.lastOpenedId = this.highlightedId;
        
        // Abrir modal de detalle/procesamiento para cualquier estado
        setTimeout(() => this.abrirDetalle(found), 800);
      }
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'bg-warning-subtle text-dark';
      case 'ACEPTADA': return 'bg-success-subtle text-dark';
      case 'RECHAZADA': return 'bg-danger-subtle text-dark';
      default: return 'bg-light text-dark';
    }
  }

  abrirDetalle(s: SolicitudRenovacion) {
    this.seleccionada = s;
    const modalEl = document.getElementById('modalDetalle');
    if (modalEl) {
      // @ts-ignore
      this.modalDetalle = new bootstrap.Modal(modalEl);
      this.modalDetalle.show();
    }
  }

  abrirAprobacion(s: SolicitudRenovacion) {
    this.seleccionada = s;
    const modalEl = document.getElementById('modalAprobar');
    if (modalEl) {
      // @ts-ignore
      this.modalAprobar = new bootstrap.Modal(modalEl);
      this.modalAprobar.show();
    }
  }

  irAProcesar() {
    if (this.seleccionada) {
      const s = { ...this.seleccionada };
      // Ocultar modal detalle
      const btn = document.querySelector('#modalDetalle [data-bs-dismiss="modal"]') as HTMLElement;
      btn?.click();
      setTimeout(() => this.abrirAprobacion(s), 400);
    }
  }

  abrirRechazo(s: SolicitudRenovacion) {
    this.seleccionada = s;
    this.motivoRechazo = '';
    const modalEl = document.getElementById('modalRechazar');
    if (modalEl) {
      // @ts-ignore
      this.modalRechazar = new bootstrap.Modal(modalEl);
      this.modalRechazar.show();
    }
  }

  cerrarYRechazar() {
    if (this.seleccionada) {
      const s = { ...this.seleccionada };
      // Ocultar modal actual via data-bs-dismiss o manualmente
      const btn = document.querySelector('#modalAprobar [data-bs-dismiss="modal"]') as HTMLElement;
      btn?.click();
      setTimeout(() => this.abrirRechazo(s), 400);
    }
  }

  procesar(estado: 'ACEPTADA' | 'RECHAZADA') {
    if (!this.seleccionada) return;

    this.cargando = true;
    const data: SolicitudRenovacionProcess = {
      estado,
      motivo_rechazo: estado === 'RECHAZADA' ? this.motivoRechazo : undefined
    };

    this.api.procesarSolicitud(this.seleccionada.id, data)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: () => {
          this.uiService.showToast(
            estado === 'ACEPTADA' ? 'Renovación aprobada con éxito' : 'Solicitud rechazada con éxito',
            estado === 'ACEPTADA' ? 'success' : 'warning'
          );
          
          if (estado === 'RECHAZADA') {
             const btn = document.querySelector('#modalRechazar [data-bs-dismiss="modal"]') as HTMLElement;
             btn?.click();
          } else {
             const btn = document.querySelector('#modalAprobar [data-bs-dismiss="modal"]') as HTMLElement;
             btn?.click();
          }

          this.seleccionada = null;
          this.motivoRechazo = ''; // Reset
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.uiService.showToast(err.error?.detail || 'Error al procesar', 'danger');
        }
      });
  }
}
