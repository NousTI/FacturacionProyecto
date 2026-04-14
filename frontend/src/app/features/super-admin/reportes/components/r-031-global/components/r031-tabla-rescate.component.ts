import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaZonaRescate } from '../../../services/reportes.service';
import { InfoTooltipComponent } from '../../../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-r031-tabla-rescate',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent],
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
            <tr *ngFor="let e of empresas">
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
              <td colspan="7" class="text-center py-5 text-muted">
                <i class="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                No hay empresas en zona de rescate actualmente.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .card-tabla { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; }
    .tabla-header { background: #fef2f2; border-bottom: 1px solid #fee2e2; }
    
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
