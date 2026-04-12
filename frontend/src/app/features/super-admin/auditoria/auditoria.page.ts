import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuditoriaService, LogAuditoria } from './services/auditoria.service';
import { UiService } from '../../../shared/services/ui.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import {
  AuditoriaStatsComponent,
  AuditoriaActionsComponent,
  AuditoriaTableComponent,
  AuditoriaPaginacionComponent,
  AuditoriaDetailModalComponent,
  FiltrosAuditoria,
  PaginationState
} from './components';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    ToastComponent,
    AuditoriaStatsComponent,
    AuditoriaActionsComponent,
    AuditoriaTableComponent,
    AuditoriaPaginacionComponent,
    AuditoriaDetailModalComponent
  ],
  template: `
    <div class="auditoria-page-container animate__animated animate__fadeIn">
      
      <!-- 1. Estadísticas -->
      <app-auditoria-stats [stats]="stats"></app-auditoria-stats>

      <!-- 2. Acciones y Filtros -->
      <app-auditoria-actions
        [filtros]="filtros"
        (filtrar)="onFiltrar($event)"
        (exportar)="exportarExcel()"
      ></app-auditoria-actions>

      <!-- 3. Tabla de Resultados -->
      <app-auditoria-table
        [logs]="logsActuales"
        [isLoading]="isLoading"
        (onVerDetalle)="abrirDetalle($event)"
      ></app-auditoria-table>

      <!-- 4. Paginación -->
      <app-auditoria-paginacion
        [pagination]="pagination"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
      ></app-auditoria-paginacion>

      <!-- 5. Modal de Detalle -->
      <app-auditoria-detail-modal
        *ngIf="showDetailModal"
        [log]="selectedLog"
        (onClose)="cerrarDetalle()"
      ></app-auditoria-detail-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      overflow: hidden;
      min-height: 0;
    }
    .auditoria-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
      position: relative;
    }
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

  // Stats
  stats = { total: 0, alertas: 0, modulos: 0, hoy: 0 };

  // Modales
  showDetailModal = false;
  selectedLog: LogAuditoria | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private auditoriaService: AuditoriaService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarLogs();
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
    this.isLoading = true;
    this.pagination.currentPage = 1;

    this.auditoriaService.listarAuditoria(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.logsTotal = data;
          this.pagination.totalItems = data.length;
          this.calculateStats(data);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al cargar auditoría');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  calculateStats(data: LogAuditoria[]) {
    const hoy = new Date().toISOString().split('T')[0];
    const alertasEventos = ['LOGIN_FALLIDO', 'ERROR', 'BLOQUEO', 'ELIMINADO'];
    
    this.stats = {
      total: data.length,
      alertas: data.filter(l => alertasEventos.some(e => l.evento.toUpperCase().includes(e))).length,
      modulos: new Set(data.map(l => l.modulo)).size,
      hoy: data.filter(l => l.created_at.startsWith(hoy)).length
    };
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
    this.pagination.currentPage = 1;
    this.cdr.detectChanges();
  }

  abrirDetalle(log: LogAuditoria) {
    this.selectedLog = log;
    this.showDetailModal = true;
    this.cdr.detectChanges();
  }

  cerrarDetalle() {
    this.showDetailModal = false;
    this.selectedLog = null;
    this.cdr.detectChanges();
  }

  exportarExcel() {
    this.uiService.showToast('Generando reporte en formato Excel...', 'info');
    // Implementación futura de exportación real
  }
}
