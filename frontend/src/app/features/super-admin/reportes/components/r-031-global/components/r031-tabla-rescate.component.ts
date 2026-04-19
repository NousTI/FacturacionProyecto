import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaZonaRescate } from '../../../services/reportes.service';
import { InfoTooltipComponent } from '../../../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-r031-tabla-rescate',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoTooltipComponent],
  template: `
    <div class="card-tabla mb-4 shadow-sm">
      <div class="tabla-header d-flex justify-content-between align-items-center p-3">
        <h6 class="mb-0"><i class="bi bi-shield-exclamation text-danger me-2"></i>Zona de rescate (Empresas Bloqueadas)</h6>
        <span class="badge bg-danger-subtle text-danger">{{ empresas.length }} empresas</span>
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
            <tr *ngFor="let e of paginatedEmpresas">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="avatar-sm bg-danger-subtle text-danger">{{ e.nombre_empresa.charAt(0) }}</div>
                  <div class="d-flex flex-column">
                    <div class="d-flex align-items-center gap-1">
                      <span class="fw-bold text-dark">{{ e.nombre_empresa }}</span>
                      <app-info-tooltip
                        [message]="getTooltipMessage(e)"
                        icon="bi-info-circle">
                      </app-info-tooltip>
                    </div>
                    <span class="text-muted small">ID: {{ e.id.toString().substring(0,8) }}</span>
                  </div>
                </div>
              </td>
              <td><span class="badge bg-light text-dark border">{{ e.plan_nombre }}</span></td>
              <td>
                <div class="d-flex flex-column">
                  <span class="fw-medium">{{ formatUltimoAcceso(e) }}</span>
                  <span class="text-muted smaller" *ngIf="e.ultimo_acceso && !isOver30Days(e.ultimo_acceso)">{{ e.ultimo_acceso | date:'shortTime' }}</span>
                </div>
              </td>
              <td class="text-muted small">{{ e.fecha_vencimiento | date:'yyyy-MM-dd' }}</td>
              <td class="small">{{ e.email || '—' }}</td>
              <td class="small">{{ e.telefono || '—' }}</td>
              <td>
                <span class="badge" [ngClass]="getDeadlineClass(e.deadline_fmt || '')">
                  <i class="bi bi-clock-history me-1"></i>{{ e.deadline_fmt }}
                </span>
              </td>
              <td class="text-center">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-success" (click)="onReactivar.emit(e)" title="Reactivar">
                    <i class="bi bi-arrow-repeat"></i>
                  </button>
                  <button class="btn btn-outline-danger" (click)="onEliminar.emit(e)" title="Eliminar definitivamente">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="empresas.length === 0">
              <td colspan="8" class="text-center py-5 text-muted">
                <i class="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                No hay empresas en zona de rescate actualmente.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Paginación footer -->
      <div class="pagination-premium-container">
        <div class="d-flex align-items-center justify-content-between px-4 py-3">
          <div class="d-flex align-items-center gap-3">
            <span class="text-muted fw-600" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Registros por página:</span>
            <select class="form-select-premium-sm" [(ngModel)]="pageSize" (change)="onPageSizeChange($event)">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
          </div>
          <div class="text-center">
            <span class="text-muted fw-500" style="font-size: 0.85rem;">
              Mostrando <strong class="text-dark">{{ startItem }} - {{ endItem }}</strong> de <strong class="text-dark">{{ empresas.length }}</strong> registros
            </span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn-nav-premium" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1" title="Anterior">
              <i class="bi bi-chevron-left"></i>
            </button>
            <div class="page-indicator-premium">{{ currentPage }}</div>
            <button class="btn-nav-premium" [disabled]="currentPage === totalPages" (click)="currentPage = currentPage + 1" title="Siguiente">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-tabla { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; }
    .card-tabla .table-responsive { max-height: 575px; overflow-y: auto; }
    .tabla-header { background: #fef2f2; border-bottom: 1px solid #fee2e2; }
    .pagination-premium-container { background: #ffffff; border-top: 1px solid #e2e8f0; }
    .form-select-premium-sm { padding: 0.4rem 2rem 0.4rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 0.85rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
    .form-select-premium-sm:focus { border-color: #161d35; outline: none; }
    .btn-nav-premium { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; cursor: pointer; }
    .btn-nav-premium:hover:not(:disabled) { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
    .btn-nav-premium:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-indicator-premium { min-width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #161d35; color: white; font-weight: 700; font-size: 0.9rem; padding: 0 0.75rem; }
    .fw-600 { font-weight: 600; }
    .fw-500 { font-weight: 500; }
    
    th { background: #f8fafc; padding: 0.75rem 1rem; font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    
    .avatar-sm { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; }
    
    .smaller { font-size: 0.7rem; }
    .bg-danger-subtle { background-color: #fee2e2 !important; }
    .text-danger { color: #ef4444 !important; }
    
    .badge-deadline-danger { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }
    .badge-deadline-warning { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
    .badge-deadline-info { background: #f0f9ff; color: #0284c7; border: 1px solid #e0f2fe; }
  `]
})
export class R031TablaRescateComponent {
  @Input() empresas: EmpresaZonaRescate[] = [];
  @Output() onReactivar = new EventEmitter<EmpresaZonaRescate>();
  @Output() onEliminar = new EventEmitter<EmpresaZonaRescate>();

  currentPage = 1;
  pageSize = 10;

  get paginatedEmpresas() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.empresas.slice(start, start + this.pageSize);
  }
  get totalPages() { return Math.ceil(this.empresas.length / this.pageSize) || 1; }
  get startItem() { return this.empresas.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get endItem() { return Math.min(this.currentPage * this.pageSize, this.empresas.length); }

  onPageSizeChange(event: Event) {
    this.pageSize = +(event.target as HTMLSelectElement).value;
    this.currentPage = 1;
  }

  getTooltipMessage(e: EmpresaZonaRescate): string {
    const venderor = e.vendedor_nombre || 'Asignación Directa';
    const rep = e.representante || 'No registrado';
    const ant = this.getAntiguedadFmt(e.fecha_registro);
    return `Vendedor: ${venderor}\nAntigüedad: ${ant}\nRepresentante: ${rep}`;
  }

  getAntiguedadFmt(fecha: string | null): string {
    if (!fecha) return 'N/A';
    const inicio = new Date(fecha).getTime();
    const ahora = new Date().getTime();
    const diff = ahora - inicio;
    const anios = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const meses = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    
    if (anios > 0) return `${anios} ${anios === 1 ? 'año' : 'años'}${meses > 0 ? ' y ' + meses + ' m' : ''}`;
    if (meses > 0) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${dias} ${dias === 1 ? 'día' : 'días'}`;
  }

  isOver30Days(fecha: string | null): boolean {
    if (!fecha) return false;
    const diff = new Date().getTime() - new Date(fecha).getTime();
    return diff > (1000 * 60 * 60 * 24 * 30);
  }

  formatUltimoAcceso(e: EmpresaZonaRescate): string {
    if (!e.ultimo_acceso) return 'Nunca';
    const diffMs = new Date().getTime() - new Date(e.ultimo_acceso).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return new Date(e.ultimo_acceso).toLocaleDateString();
    }
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return '1 día';
    return `${diffDays} días`;
  }

  getDeadlineClass(fmt: string): string {
    if (!fmt) return 'badge-deadline-info';
    if (fmt.includes('h') || fmt.includes('min') || fmt.includes('Vencido')) return 'badge-deadline-danger';
    if (fmt.includes('días')) {
      const dias = parseInt(fmt);
      if (dias <= 3) return 'badge-deadline-danger';
      if (dias <= 7) return 'badge-deadline-warning';
    }
    return 'badge-deadline-info';
  }
}
