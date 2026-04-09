import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuditoriaService, LogAuditoria } from './services/auditoria.service';
import { UiService } from '../../../shared/services/ui.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  template: `
    <div class="auditoria-container animate__animated animate__fadeIn">

      <!-- Filtros Rápidos -->
      <div class="card filter-card border-0 shadow-sm mb-4">
          <div class="card-body py-3">
              <div class="row g-3 align-items-end">
                  <div class="col-md-3">
                      <label class="form-label small fw-bold text-muted text-uppercase mb-1">Buscar Usuario</label>
                      <div class="input-group input-group-sm">
                          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                          <input type="text" class="form-control border-start-0 ps-0" [(ngModel)]="filtros.usuario" placeholder="Nombre o email..." (keyup.enter)="cargarLogs()">
                      </div>
                  </div>
                  <div class="col-md-2">
                      <label class="form-label small fw-bold text-muted text-uppercase mb-1">Evento</label>
                      <select class="form-select form-select-sm" [(ngModel)]="filtros.evento" (change)="cargarLogs()">
                          <option value="">Todos los eventos</option>
                          <option value="LOGIN_OK">LOGIN OK</option>
                          <option value="LOGOUT">LOGOUT</option>
                          <option value="PASSWORD_CAMBIADA">PASSWORD CAMBIADA</option>
                          <option value="CUENTA_DESBLOQUEADA">CUENTA DESBLOQUEADA</option>
                          <option value="CUENTA_DESHABILITADA">CUENTA DESHABILITADA</option>
                          <option value="COMISION_PENDIENTE">COMISION PENDIENTE</option>
                          <option value="COMISION_APROBADA">COMISION APROBADA</option>
                          <option value="COMISION_PAGADA">COMISION PAGADA</option>
                          <option value="PLAN_ACTIVA">PLAN ACTIVA</option>
                          <option value="PLAN_CANCELADA">PLAN CANCELADA</option>

                      </select>
                  </div>
                  <div class="col-md-2">
                      <label class="form-label small fw-bold text-muted text-uppercase mb-1">Desde</label>
                      <input type="date" class="form-control form-control-sm" [(ngModel)]="filtros.fecha_inicio">
                  </div>
                  <div class="col-md-2">
                      <label class="form-label small fw-bold text-muted text-uppercase mb-1">Hasta</label>
                      <input type="date" class="form-control form-control-sm" [(ngModel)]="filtros.fecha_fin">
                  </div>
                  <div class="col-md-3 d-flex gap-2">
                      <button class="btn btn-primary btn-sm flex-grow-1 fw-bold rounded-pill" (click)="cargarLogs()">
                          <i class="bi bi-filter me-1"></i> Filtrar
                      </button>
                      <button class="btn btn-outline-success btn-sm rounded-pill" (click)="exportarExcel()">
                          <i class="bi bi-file-earmark-excel"></i>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <!-- Tabla de Logs -->
      <div class="card border-0 shadow-sm overflow-hidden">
          <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light border-bottom">
                      <tr>
                          <th class="ps-4 py-3 text-uppercase small fw-bold text-muted">Fecha y Hora</th>
                          <th class="py-3 text-uppercase small fw-bold text-muted">Módulo</th>
                          <th class="py-3 text-uppercase small fw-bold text-muted">Usuario/Actor</th>
                          <th class="py-3 text-uppercase small fw-bold text-muted">Evento</th>
                          <th class="py-3 text-uppercase small fw-bold text-muted">Detalles</th>
                          <th class="py-3 text-uppercase small fw-bold text-muted text-center">IP</th>
                      </tr>
                  </thead>
                  <tbody *ngIf="!isLoading">
                      <tr *ngFor="let log of logs" class="animate__animated animate__fadeIn">
                          <td class="ps-4">
                              <div class="d-flex flex-column">
                                  <span class="text-dark fw-medium small">{{ log.created_at | date:'dd/MM/yyyy' }}</span>
                                  <span class="text-muted" style="font-size: 0.75rem;">{{ log.created_at | date:'HH:mm:ss' }}</span>
                              </div>
                          </td>
                          <td>
                              <span class="modulo-tag text-uppercase">{{ log.modulo || 'GENERAL' }}</span>
                          </td>
                          <td>
                              <div class="d-flex align-items-center">
                                  <div class="avatar-sm me-2 rounded-circle bg-light d-flex align-items-center justify-content-center text-primary fw-bold">
                                      {{ (log.actor_nombre || 'S')[0] }}
                                  </div>
                                  <div class="d-flex flex-column">
                                      <span class="fw-bold text-dark small">{{ log.actor_nombre || 'Sistema' }}</span>
                                      <span class="text-muted x-small">{{ log.actor_email }}</span>
                                  </div>
                              </div>
                          </td>
                          <td>
                              <span class="badge rounded-pill fw-bold" [ngClass]="getBadgeClass(log.evento)">
                                  {{ log.evento.replace('_', ' ') }}
                              </span>
                          </td>
                          <td style="max-width: 300px;">
                              <p class="text-secondary small mb-0 text-truncate" [title]="log.motivo">
                                  {{ log.motivo || 'Sin detalles adicionales' }}
                              </p>
                          </td>
                          <td class="text-center">
                              <span class="font-monospace text-muted x-small bg-light px-2 py-1 rounded">
                                  {{ log.ip_address || '0.0.0.0' }}
                              </span>
                          </td>
                      </tr>

                      <!-- Empty State -->
                      <tr *ngIf="logs.length === 0">
                          <td colspan="5" class="py-5 text-center">
                              <div class="py-5">
                                  <i class="bi bi-shield-slash display-4 text-light"></i>
                                  <p class="text-muted mt-3">No se encontraron registros de auditoría.</p>
                              </div>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <!-- Loader -->
          <div *ngIf="isLoading" class="p-5 text-center">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="text-muted mt-2">Consultando bitácora de seguridad...</p>
          </div>
      </div>
    </div>
    <app-toast></app-toast>
  `,
  styles: [`
    .title { font-weight: 850; letter-spacing: -1px; color: #1e293b; }
    .subtitle { font-size: 0.95rem; margin-top: -5px; }
    .card { border-radius: 20px; }
    .filter-card { background: #fdfdfd; }
    
    .avatar-sm { width: 32px; height: 32px; font-size: 0.75rem; }
    
    .badge {
        font-size: 0.65rem;
        padding: 0.5em 1em;
        text-transform: uppercase;
    }
    
    .bg-login-ok { background-color: #dcfce7; color: #166534; }
    .bg-login-fail { background-color: #fee2e2; color: #991b1b; }
    .bg-create { background-color: #e0e7ff; color: #3730a3; }
    .bg-update { background-color: #fef9c3; color: #854d0e; }
    .bg-comision { background-color: #dcfce7; color: #166534; }
    .bg-plan { background-color: #fce7f3; color: #9d174d; }
    .bg-vendor { background-color: #fff7ed; color: #9a3412; }
    .bg-sri { background-color: #f0f9ff; color: #075985; }
    .bg-default { background-color: #f1f5f9; color: #475569; }

    .modulo-tag {
        font-size: 0.65rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        color: #64748b;
        font-weight: 700;
    }

    .x-small { font-size: 0.7rem; }
    
    .spinner-animation {
        animation: rotate 1s linear infinite;
        display: inline-block;
    }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .table thead th { border-top: none; }
  `]
})
export class AuditoriaPage implements OnInit, OnDestroy {
  logs: LogAuditoria[] = [];
  isLoading = false;
  filtros = {
    usuario: '',
    evento: '',
    fecha_inicio: '',
    fecha_fin: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private auditoriaService: AuditoriaService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Pequeño delay para asegurar que el componente esté totalmente inicializado
    setTimeout(() => this.cargarLogs(), 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarLogs() {
    console.log('[AuditoriaPage] Iniciando carga de logs con filtros:', this.filtros);
    this.isLoading = true;
    this.auditoriaService.listarAuditoria(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('[AuditoriaPage] Datos recibidos con éxito:', data);
          this.logs = data;
          this.isLoading = false;
          this.cdr.detectChanges(); // Forzar actualización de la UI
        },
        error: (err) => {
          console.error('[AuditoriaPage] ERROR detallado al cargar logs:', err);
          this.uiService.showError(err, 'Error al cargar auditoría');
          this.isLoading = false;
          this.cdr.detectChanges(); // Forzar actualización de la UI
        }
      });
  }

  getBadgeClass(evento: string): string {
    const ev = evento.toUpperCase();
    if (ev.includes('LOGIN_OK')) return 'bg-login-ok';
    if (ev.includes('LOGIN_FALLIDO')) return 'bg-login-fail';
    if (ev.includes('CREADO')) return 'bg-create';
    if (ev.includes('EDITAD') || ev.includes('ACTUALIZADO')) return 'bg-update';
    if (ev.includes('COMISION')) return 'bg-comision';
    if (ev.includes('PLAN') || ev.includes('SUSCRIPCION')) return 'bg-plan';
    if (ev.includes('VENDEDOR')) return 'bg-vendor';
    if (ev.includes('SRI')) return 'bg-sri';
    return 'bg-default';
  }

  exportarExcel() {
    this.uiService.showToast('Generando reporte de auditoría...', 'info');
    // En una app real, aquí llamaríamos a un endpoint que genere XLSX o CSV
    // Por ahora, solo es visual para cumplir el mockup pedido.
  }
}
