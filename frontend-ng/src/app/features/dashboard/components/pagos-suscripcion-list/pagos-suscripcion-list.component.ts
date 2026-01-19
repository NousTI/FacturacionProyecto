import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagoSuscripcionService, PagoSuscripcion } from '../../../../core/services/pago-suscripcion.service';
import { FeedbackService } from '../../../../shared/services/feedback.service';

@Component({
  selector: 'app-pagos-suscripcion-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagos-content">
      <div class="d-flex justify-content-end mb-4" header-actions>
            <button class="btn btn-dark rounded-pill px-4 fw-bold shadow-sm border" (click)="cargarPagos(true)">
                <i class="bi bi-arrow-clockwise me-2"></i> Actualizar
            </button>
      </div>


      <!-- SUMMARY WIDGETS -->
      <div class="row g-4 mb-5">
        <div class="col-md-6 col-lg-3">
          <div class="card border-0 p-4 shadow-sm h-100" style="border-radius: 20px;">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style="width: 45px; height: 45px;">
                    <i class="bi bi-cash-stack fs-4"></i>
                </div>
                <span class="badge bg-success-subtle text-success rounded-pill px-2">Este mes</span>
            </div>
            <h6 class="text-uppercase text-muted small fw-bold mb-1">Recaudado</h6>
            <h3 class="fw-bold mb-0 text-dark">$ {{ totalMes() | number:'1.2-2' }}</h3>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card border-0 p-4 shadow-sm h-100" style="border-radius: 20px; cursor: pointer;" (click)="cambiarFiltro('PENDING')">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style="width: 45px; height: 45px;">
                    <i class="bi bi-hourglass-split fs-4"></i>
                </div>
            </div>
            <h6 class="text-uppercase text-muted small fw-bold mb-1">Pendientes</h6>
            <h3 class="fw-bold mb-0 text-dark">{{ totalPendientes() }}</h3>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm p-4" style="border-radius: 20px;">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr class="bg-dark text-white shadow-sm">
                <th class="ps-4 py-3 border-0 rounded-start-4">Empresa / Detalle</th>
                <th class="py-3 border-0">Monto</th>
                <th class="py-3 border-0">Periodo</th>
                <th class="py-3 border-0">Método</th>
                <th class="py-3 border-0">Estado</th>
                <th class="py-3 border-0 text-end pe-4 rounded-end-4">Acciones</th>
              </tr>
            </thead>
            <tbody class="border-top-0">
              <tr class="spacer" style="height: 15px;"></tr>
              @if (loading()) {
               <tr>
                 <td colspan="6" class="text-center py-5">
                    <div class="spinner-border text-dark" role="status"></div>
                    <div class="mt-2 text-muted fw-bold">Cargando transacciones...</div>
                 </td>
               </tr>
              } @else if (pagosFiltrados().length === 0) {
               <tr>
                 <td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-search fs-2 mb-2 d-block opacity-25"></i>
                    No hay registros que coincidan con los filtros.
                 </td>
               </tr>
              } @else {
                  @for (pago of pagosFiltrados(); track pago.id) {
                  <tr class="border-bottom">
                    <td class="ps-4">
                        <div class="fw-bold text-dark">{{ pago.empresa_nombre || pago.empresa_id }}</div>
                        <div class="small text-muted">{{ pago.plan_nombre }}</div>
                    </td>
                    <td>
                        <div class="fw-bold fs-5">$ {{ pago.monto | number:'1.2-2' }}</div>
                    </td>
                    <td>
                        <div class="small fw-bold">
                            {{ pago.fecha_inicio_periodo | date:'dd MMM, yyyy' }}
                        </div>
                        <div class="small text-muted">al {{ pago.fecha_fin_periodo | date:'dd MMM, yyyy' }}</div>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border-0 rounded-pill px-3 py-2 fw-bold small text-uppercase" style="letter-spacing: 0.5px;">
                            {{ pago.metodo_pago }}
                        </span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="rounded-circle" [ngClass]="getStatusDotClass(pago.estado)" style="width: 8px; height: 8px;"></div>
                            <span class="fw-bold small text-uppercase" style="letter-spacing: 0.5px;">{{ getStatusLabel(pago.estado) }}</span>
                        </div>
                    </td>
                    <td class="text-end pe-4">
                        <div class="d-flex justify-content-end gap-2">
                            @if (pago.estado === 'PENDING') {
                                <button class="btn btn-dark btn-sm rounded-pill px-3 fw-bold" (click)="aprobarPago(pago.id)">Aprobar</button>
                                <button class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold" (click)="rechazarPago(pago.id)">Rechazar</button>
                            }
                            @if (pago.comprobante_url) {
                                <button class="btn btn-light btn-sm rounded-circle shadow-sm border" (click)="verComprobante(pago.comprobante_url)" title="Ver Comprobante">
                                    <i class="bi bi-file-earmark-image"></i>
                                </button>
                            }
                        </div>
                    </td>
                  </tr>
                  }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .table thead th { border-radius: 0; }
    .table thead th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
    .table thead th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
    .table td { vertical-align: middle; padding: 1.25rem 0.5rem; }
    .form-control:focus, .form-select:focus { box-shadow: none; border-color: #000; }
    .btn-dark { background-color: #000; border-color: #000; }
    .btn-dark:hover { background-color: #222; }
    
    .dot-pending { background-color: #ffb347; box-shadow: 0 0 10px rgba(255, 179, 71, 0.4); }
    .dot-completed { background-color: #00ca72; box-shadow: 0 0 10px rgba(0, 202, 114, 0.4); }
    .dot-rejected { background-color: #ff4d6d; box-shadow: 0 0 10px rgba(255, 77, 109, 0.4); }
  `]
})
export class PagosSuscripcionListComponent implements OnInit {
  private pagoService = inject(PagoSuscripcionService);
  private feedback = inject(FeedbackService);

  pagos = signal<PagoSuscripcion[]>([]);
  loading = signal<boolean>(false);

  // Local filter states
  filtroEstado = signal<string>('');
  filtroEmpresa = signal<string>('');
  filtroFechaInicio = signal<string>('');
  filtroFechaFin = signal<string>('');

  // Computed signal for filtered list
  pagosFiltrados = computed(() => {
    let list = this.pagos();

    if (this.filtroEstado()) {
      list = list.filter(p => p.estado === this.filtroEstado());
    }

    if (this.filtroEmpresa()) {
      const search = this.filtroEmpresa().toLowerCase();
      list = list.filter(p =>
        (p.empresa_nombre?.toLowerCase() || '').includes(search) ||
        p.empresa_id.includes(search)
      );
    }

    if (this.filtroFechaInicio()) {
      const start = new Date(this.filtroFechaInicio());
      list = list.filter(p => new Date(p.fecha_pago) >= start);
    }

    if (this.filtroFechaFin()) {
      const end = new Date(this.filtroFechaFin());
      end.setHours(23, 59, 59, 999);
      list = list.filter(p => new Date(p.fecha_pago) <= end);
    }

    return list;
  });

  // Status Styling Constants
  readonly STATUS_CONFIG: { [key: string]: { label: string, dotClass: string } } = {
    'PENDING': { label: 'Pendiente', dotClass: 'dot-pending' },
    'COMPLETED': { label: 'Completado', dotClass: 'dot-completed' },
    'PAGADO': { label: 'Completado', dotClass: 'dot-completed' },
    'REJECTED': { label: 'Rechazado', dotClass: 'dot-rejected' }
  };

  getStatusLabel(estado: string): string {
    return this.STATUS_CONFIG[estado]?.label || estado;
  }

  getStatusDotClass(estado: string): string {
    return this.STATUS_CONFIG[estado]?.dotClass || 'bg-secondary';
  }

  ngOnInit() {
    this.cargarPagos();
  }

  cargarPagos(force: boolean = false) {
    this.loading.set(true);
    this.pagoService.getPagos(undefined, force).subscribe({
      next: (data) => {
        this.pagos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.feedback.showError('Error al cargar pagos: ' + err.message);
      }
    });
  }

  onSearchEmpresa(event: any) {
    this.filtroEmpresa.set(event.target.value);
  }

  onDateChange(type: 'inicio' | 'fin', event: any) {
    if (type === 'inicio') this.filtroFechaInicio.set(event.target.value);
    else this.filtroFechaFin.set(event.target.value);
  }

  onStatusChange(event: any) {
    this.filtroEstado.set(event.target.value);
  }

  cambiarFiltro(estado: string) {
    this.filtroEstado.set(estado);
  }

  aprobarPago(id: string) {
    this.feedback.showLoading();
    this.pagoService.aprobarPago(id).subscribe({
      next: () => {
        this.feedback.hideLoading();
        this.feedback.showSuccess('Pago aprobado correctamente.');
        this.pagoService.clearCache();
        this.cargarPagos(true);
      },
      error: (err) => {
        this.feedback.hideLoading();
        this.feedback.showError('Error al aprobar: ' + (err.error?.detail || err.message));
      }
    });
  }

  rechazarPago(id: string) {
    const motivo = prompt('Ingrese el motivo del rechazo (opcional):');
    if (motivo === null) return;

    this.feedback.showLoading();
    this.pagoService.rechazarPago(id, motivo).subscribe({
      next: () => {
        this.feedback.hideLoading();
        this.feedback.showSuccess('Pago rechazado correctamente.');
        this.pagoService.clearCache();
        this.cargarPagos(true);
      },
      error: (err) => {
        this.feedback.hideLoading();
        this.feedback.showError('Error al rechazar: ' + (err.error?.detail || err.message));
      }
    });
  }

  totalMes() {
    const ahora = new Date();
    return this.pagos()
      .filter(p => {
        const fecha = new Date(p.fecha_pago);
        return (p.estado === 'COMPLETED' || p.estado === 'PAGADO') &&
          fecha.getMonth() === ahora.getMonth() &&
          fecha.getFullYear() === ahora.getFullYear();
      })
      .reduce((sum, p) => sum + Number(p.monto), 0);
  }

  totalPendientes() {
    return this.pagos().filter(p => p.estado === 'PENDING').length;
  }

  verComprobante(url: string) {
    window.open(url, '_blank');
  }
}
