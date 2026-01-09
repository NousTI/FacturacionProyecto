import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComisionService, Comision } from '../../../../core/services/comision.service';
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-comisiones-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="container-fluid p-0">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="h4 mb-1 fw-bold">Gestión de Comisiones</h2>
            <p class="text-muted small mb-0">Seguimiento y registro de pagos a vendedores por suscripciones.</p>
        </div>
      </div>

      <!-- SUMMARY -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
            <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div class="small text-muted fw-bold text-uppercase mb-1">Total Pendiente</div>
                <div class="h3 mb-0 fw-bold text-warning">$ {{ totalPendiente() }}</div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div class="small text-muted fw-bold text-uppercase mb-1">Total Pagado (Mes)</div>
                <div class="h3 mb-0 fw-bold text-success">$ {{ totalPagadoMes() }}</div>
            </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-secondary small text-uppercase">
              <tr>
                <th class="ps-4">Vendedor</th>
                <th>Concepto / Empresa</th>
                <th>Comisión</th>
                <th>Estado</th>
                <th>Fecha Generación</th>
                <th class="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody class="border-top-0">
              @for (com of comisiones(); track com.id) {
              <tr>
                <td class="ps-4">
                  <div class="fw-bold text-dark">{{ com.vendedor_nombre }}</div>
                </td>
                <td>
                  <div class="small text-dark fw-medium">{{ com.empresa_nombre }}</div>
                  <div class="small text-muted">Pago Base: $ {{ com.monto_pago }}</div>
                </td>
                <td>
                  <div class="fw-bold text-primary">$ {{ com.monto }}</div>
                  <div class="small text-muted">({{ com.porcentaje_aplicado }}%)</div>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="getStatusClass(com.estado)">
                    {{ getStatusLabel(com.estado) }}
                  </span>
                </td>
                <td>
                  <div class="small text-dark">{{ com.fecha_generacion | date:'dd/MM/yyyy' }}</div>
                </td>
                <td class="text-end pe-4">
                  <button *ngIf="com.estado === 'PENDIENTE'" 
                          class="btn btn-primary btn-sm rounded-3 px-3 shadow-sm"
                          style="background-color: #00ca72; border: none;"
                          (click)="openPayModal(com)">
                    Registrar Pago
                  </button>
                  <button *ngIf="com.estado === 'PAGADA'" 
                          class="btn btn-light btn-sm rounded-3 px-3 border"
                          (click)="openPayModal(com)">
                    Ver Detalles
                  </button>
                </td>
              </tr>
              }
              @if (comisiones().length === 0) {
              <tr>
                <td colspan="6" class="text-center py-5 text-secondary">
                  No se encontraron comisiones registradas.
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PAYMENT MODAL -->
    @if (payModalOpen()) {
    <app-modal [title]="selectedComision()?.estado === 'PAGADA' ? 'Detalle de Pago' : 'Registrar Pago de Comisión'" [size]="'md'" (close)="closePayModal()">
        <div class="px-2">
            <div class="p-3 bg-light rounded-4 mb-4 border shadow-sm">
                <div class="row g-2">
                    <div class="col-6">
                        <div class="small text-muted">Vendedor</div>
                        <div class="fw-bold">{{ selectedComision()?.vendedor_nombre }}</div>
                    </div>
                    <div class="col-6 text-end">
                        <div class="small text-muted">Monto a Pagar</div>
                        <div class="h4 mb-0 fw-bold text-primary">$ {{ selectedComision()?.monto }}</div>
                    </div>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label small fw-bold text-secondary text-uppercase">Método de Pago</label>
                <select class="form-select border-2" [(ngModel)]="paymentMethod" 
                        [disabled]="selectedComision()?.estado === 'PAGADA'" style="border-radius: 10px;">
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTRO">Otro</option>
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label small fw-bold text-secondary text-uppercase">Fecha de Pago</label>
                <input type="date" class="form-control border-2" [(ngModel)]="paymentDate"
                       [disabled]="selectedComision()?.estado === 'PAGADA'" style="border-radius: 10px;">
            </div>

            <div class="mb-3">
                <label class="form-label small fw-bold text-secondary text-uppercase">Observaciones / Referencia</label>
                <textarea class="form-control border-2" rows="3" [(ngModel)]="paymentObs"
                          [disabled]="selectedComision()?.estado === 'PAGADA'"
                          placeholder="Nro de comprobante, banco, etc..." style="border-radius: 10px;"></textarea>
            </div>
        </div>

        <ng-container footer>
            <button class="btn btn-light rounded-3 px-4" (click)="closePayModal()">Cerrar</button>
            <button *ngIf="selectedComision()?.estado === 'PENDIENTE'"
                    class="btn btn-primary rounded-3 px-4 shadow-sm" [disabled]="saving()" (click)="confirmPayment()" 
                    style="background-color: #5a4bda; border: none;">
                {{ saving() ? 'Procesando...' : 'Confirmar Pago' }}
            </button>
        </ng-container>
    </app-modal>
    }
  `,
  styles: [`
    .table th { border: none; font-weight: 600; font-size: 0.75rem; color: #6c757d; }
    .table td { padding: 1.25rem 0.5rem; border-color: #f1f3f5; }
    
    .status-badge {
        display: inline-block;
        padding: 0.35rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        border-radius: 6px;
        border: 2px solid;
        color: #000 !important;
        min-width: 100px;
        text-align: center;
    }

    .status-pending { background-color: #fff4e5; border-color: #ffb347; }
    .status-completed, .status-pagada { background-color: #e6f9ed; border-color: #00ca72; }
    .status-canceled { background-color: #f4f4f4; border-color: #6c757d; }
  `]
})
export class ComisionesListComponent implements OnInit {
  private comService = inject(ComisionService);
  private feedback = inject(FeedbackService);

  comisiones = signal<Comision[]>([]);
  filtroVendedor = '';

  payModalOpen = signal(false);
  selectedComision = signal<Comision | null>(null);
  saving = signal(false);

  paymentMethod = 'TRANSFERENCIA';
  paymentDate = new Date().toISOString().split('T')[0];
  paymentObs = '';

  readonly STATUS_CONFIG: { [key: string]: { label: string, class: string } } = {
    'PENDIENTE': { label: 'Pendiente', class: 'status-pending' },
    'PAGADA': { label: 'Pagada', class: 'status-pagada' },
    'CANCELADA': { label: 'Cancelada', class: 'status-canceled' }
  };

  ngOnInit() {
    this.cargarComisiones();
  }

  cargarComisiones() {
    this.comService.getComisiones().subscribe({
      next: (data) => this.comisiones.set(data),
      error: () => this.feedback.showError('Error al cargar comisiones')
    });
  }

  getStatusLabel(estado: string): string {
    return this.STATUS_CONFIG[estado]?.label || estado;
  }

  getStatusClass(estado: string): string {
    return this.STATUS_CONFIG[estado]?.class || '';
  }

  openPayModal(com: Comision) {
    this.selectedComision.set(com);
    if (com.estado === 'PAGADA') {
      this.paymentMethod = com.metodo_pago || 'TRANSFERENCIA';
      this.paymentDate = com.fecha_pago || '';
      this.paymentObs = com.observaciones || '';
    } else {
      this.paymentMethod = 'TRANSFERENCIA';
      this.paymentDate = new Date().toISOString().split('T')[0];
      this.paymentObs = '';
    }
    this.payModalOpen.set(true);
  }

  closePayModal() {
    this.payModalOpen.set(false);
  }

  confirmPayment() {
    if (!this.selectedComision()) return;
    this.saving.set(true);

    this.comService.updateComision(this.selectedComision()!.id, {
      estado: 'PAGADA',
      metodo_pago: this.paymentMethod,
      fecha_pago: this.paymentDate,
      observaciones: this.paymentObs
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closePayModal();
        this.cargarComisiones();
        this.feedback.showSuccess('Pago registrado exitosamente');
      },
      error: (err) => {
        this.saving.set(false);
        this.feedback.showError('Error al registrar pago');
      }
    });
  }

  totalPendiente() {
    return this.comisiones()
      .filter(c => c.estado === 'PENDIENTE')
      .reduce((sum, c) => sum + Number(c.monto), 0)
      .toFixed(2);
  }

  totalPagadoMes() {
    const ahora = new Date();
    return this.comisiones()
      .filter(c => {
        if (c.estado !== 'PAGADA' || !c.fecha_pago) return false;
        const f = new Date(c.fecha_pago);
        return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
      })
      .reduce((sum, c) => sum + Number(c.monto), 0)
      .toFixed(2);
  }
}
