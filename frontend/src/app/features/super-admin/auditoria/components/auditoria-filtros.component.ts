import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FiltrosAuditoria {
  usuario: string;
  evento: string;
  fecha_inicio: string;
  fecha_fin: string;
}

@Component({
  selector: 'app-auditoria-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card filter-card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label small fw-bold text-muted text-uppercase mb-1">Buscar Usuario</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
              <input
                type="text"
                class="form-control border-start-0 ps-0"
                [(ngModel)]="filtros.usuario"
                placeholder="Nombre o email..."
                (keyup.enter)="onFiltrar()">
            </div>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-bold text-muted text-uppercase mb-1">Evento</label>
            <select class="form-select form-select-sm" [(ngModel)]="filtros.evento" (change)="onFiltrar()">
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
            <button class="btn btn-primary btn-sm flex-grow-1 fw-bold rounded-pill" (click)="onFiltrar()">
              <i class="bi bi-filter me-1"></i> Filtrar
            </button>
            <button class="btn btn-outline-success btn-sm rounded-pill" (click)="onExportar()">
              <i class="bi bi-file-earmark-excel"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-card { background: #fdfdfd; }
  `]
})
export class AuditoriaFiltrosComponent {
  @Input() filtros: FiltrosAuditoria = {
    usuario: '',
    evento: '',
    fecha_inicio: '',
    fecha_fin: ''
  };
  @Output() filtrar = new EventEmitter<FiltrosAuditoria>();
  @Output() exportar = new EventEmitter<void>();

  onFiltrar() {
    this.filtrar.emit(this.filtros);
  }

  onExportar() {
    this.exportar.emit();
  }
}
