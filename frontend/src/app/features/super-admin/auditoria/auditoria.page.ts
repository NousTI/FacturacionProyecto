import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuditoriaService, LogAuditoria } from './services/auditoria.service';
import { UiService } from '../../../shared/services/ui.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import {
  AuditoriaFiltrosComponent,
  FiltrosAuditoria,
  AuditoriaTablComponent,
  AuditoriaPaginacionComponent,
  PaginationState
} from './components';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    ToastComponent,
    AuditoriaFiltrosComponent,
    AuditoriaTablComponent,
    AuditoriaPaginacionComponent
  ],
  template: `
    <div class="auditoria-container animate__animated animate__fadeIn">
      <!-- Filtros -->
      <app-auditoria-filtros
        [filtros]="filtros"
        (filtrar)="onFiltrar($event)"
        (exportar)="exportarExcel()">
      </app-auditoria-filtros>

      <!-- Tabla -->
      <app-auditoria-tabla
        [logs]="logsActuales"
        [isLoading]="isLoading">
      </app-auditoria-tabla>

      <!-- Paginación -->
      <app-auditoria-paginacion
        [pagination]="pagination"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)">
      </app-auditoria-paginacion>
    </div>
    <app-toast></app-toast>
  `,
  styles: [`
    .card { border-radius: 20px; }
  `]
})
export class AuditoriaPage implements OnInit, OnDestroy {
  logsTotal: LogAuditoria[] = [];
  isLoading = false;
  filtros: FiltrosAuditoria = {
    usuario: '',
    evento: '',
    fecha_inicio: '',
    fecha_fin: ''
  };

  pagination: PaginationState = {
    currentPage: 1,
    pageSize: 25,
    totalItems: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private auditoriaService: AuditoriaService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    setTimeout(() => this.cargarLogs(), 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get logsActuales(): LogAuditoria[] {
    const inicio = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    const fin = inicio + this.pagination.pageSize;
    return this.logsTotal.slice(inicio, fin);
  }

  cargarLogs() {
    console.log('[AuditoriaPage] Iniciando carga de logs con filtros:', this.filtros);
    this.isLoading = true;
    this.pagination.currentPage = 1; // Reset a la primera página

    this.auditoriaService.listarAuditoria(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('[AuditoriaPage] Datos recibidos con éxito:', data.length);
          this.logsTotal = data;
          this.pagination.totalItems = data.length;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[AuditoriaPage] ERROR detallado al cargar logs:', err);
          this.uiService.showError(err, 'Error al cargar auditoría');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onFiltrar(filtros: FiltrosAuditoria) {
    this.filtros = filtros;
    this.cargarLogs();
  }

  onPageChange(page: number) {
    this.pagination.currentPage = page;
    this.cdr.detectChanges();
  }

  onPageSizeChange(pageSize: number) {
    this.pagination.pageSize = pageSize;
    this.pagination.currentPage = 1; // Reset a la primera página
    this.cdr.detectChanges();
  }

  exportarExcel() {
    this.uiService.showToast('Generando reporte de auditoría...', 'info');
  }
}
