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

      <!-- 3. Tabla de Resultados + Paginación integrada -->
      <app-auditoria-table
        [logs]="logsActuales"
        [isLoading]="isLoading"
        [pagination]="pagination"
        (onVerDetalle)="abrirDetalle($event)"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
      ></app-auditoria-table>

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
      background: var(--bg-main);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 1.5rem;
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
    const alertasEventos = ['FALLIDO', 'ERROR', 'BLOQUEO', 'ELIMINADO', 'PASSWORD_CAMBIADA', 'EXCEPTION'];
    
    this.stats = {
      total: data.length,
      alertas: data.filter(l => alertasEventos.some(e => l.evento.toUpperCase().includes(e))).length,
      modulos: new Set(data.filter(l => l.modulo).map(l => l.modulo)).size,
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
    this.isLoading = true;

    this.auditoriaService.exportarExcel(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().split('T')[0];
          
          link.href = url;
          link.download = `reporte_auditoria_${timestamp}.xlsx`;
          link.click();
          
          window.URL.revokeObjectURL(url);
          this.uiService.showToast('Reporte exportado correctamente', 'success');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al exportar auditoría');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }
}
