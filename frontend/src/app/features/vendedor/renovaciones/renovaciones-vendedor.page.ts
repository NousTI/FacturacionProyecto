import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RenovacionesApiService } from '../../../core/api/renovaciones-api.service';
import { SolicitudRenovacion, SolicitudRenovacionCreate } from '../../../domain/models/renovacion.model';
import { VendedorEmpresaService } from '../empresas/services/vendedor-empresa.service';
import { UiService } from '../../../shared/services/ui.service';
import { finalize, Subject, takeUntil } from 'rxjs';

// Components
import { RenovacionesStatsComponent } from './components/renovaciones-stats.component';
import { RenovacionesActionsComponent } from './components/renovaciones-actions.component';
import { RenovacionesTableComponent } from './components/renovaciones-table.component';
import { RenovacionCreateModalComponent } from './components/modals/renovacion-create-modal.component';
import { RenovacionDetailModalComponent } from './components/modals/renovacion-detail-modal.component';

@Component({
  selector: 'app-renovaciones-vendedor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RenovacionesStatsComponent,
    RenovacionesActionsComponent,
    RenovacionesTableComponent,
    RenovacionCreateModalComponent,
    RenovacionDetailModalComponent
  ],
  template: `
    <div class="renovaciones-page-container">
      
      <!-- 1. Stats -->
      <app-renovaciones-stats [stats]="stats"></app-renovaciones-stats>

      <!-- 2. Actions (Search & Status Filter) -->
      <app-renovaciones-actions
        [(searchQuery)]="searchQuery"
        [currentStatus]="statusFilter"
        [currentType]="typeFilter"
        (onStatusChange)="handleStatusChange($event)"
        (onTypeChange)="handleTypeChange($event)"
        (onCreate)="showCreateModal = true"
        (onRefresh)="cargarSolicitudes()"
      ></app-renovaciones-actions>

      <!-- 3. Table -->
      <app-renovaciones-table
        [solicitudes]="filteredSolicitudes"
        [highlightedId]="highlightedId"
        (onVerDetalle)="abrirDetalle($event)"
      ></app-renovaciones-table>

      <!-- 4. Modals -->
      <app-renovacion-create-modal
        *ngIf="showCreateModal"
        [empresas]="empresas"
        [planes]="planes"
        [loading]="cargando"
        [solicitudesPendientes]="solicitudes"
        (onClose)="showCreateModal = false"
        (onSave)="enviarSolicitud($event)"
      ></app-renovacion-create-modal>

      <app-renovacion-detail-modal
        *ngIf="showDetailModal && seleccionada"
        [seleccionada]="seleccionada"
        (onClose)="closeDetailModal()"
      ></app-renovacion-detail-modal>

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
    .renovaciones-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
    }
  `]
})
export class RenovacionesVendedorPage implements OnInit, OnDestroy {
  solicitudes: SolicitudRenovacion[] = [];
  empresas: any[] = [];
  planes: any[] = [];
  
  seleccionada: SolicitudRenovacion | null = null;
  cargando: boolean = false;
  highlightedId: string | null = null;
  
  // Filters
  searchQuery: string = '';
  statusFilter: string = 'ALL';
  typeFilter: string = 'ALL';

  // Stats
  stats = { pending: 0, accepted: 0, rejected: 0 };

  // UI States
  showCreateModal = false;
  showDetailModal = false;
  
  private lastOpenedId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private api: RenovacionesApiService,
    private vendedorService: VendedorEmpresaService,
    private uiService: UiService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. Listen to global data and cache
    this.api.solicitudes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.solicitudes = data;
        this.calculateStats();
        this.checkHighlight(data);
        this.cd.detectChanges();
      });

    // 2. Initial load
    this.cargarSolicitudes();
    this.cargarEmpresas();
    this.cargarPlanes();

    // 3. Listen to query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id'] && params['id'] !== this.highlightedId) {
          this.highlightedId = params['id'];
          this.lastOpenedId = null;
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
    // Note: The original had "verHistorial" toggle. 
    // We'll pass true to get all for filtering locally, or we can adapt the API call.
    // Given the new UI, showing all and filtering locally is often preferred for "Editorial" design.
    this.api.listarSolicitudes(true).subscribe();
  }

  calculateStats() {
    this.stats = {
      pending: this.solicitudes.filter(s => s.estado === 'PENDIENTE').length,
      accepted: this.solicitudes.filter(s => s.estado === 'ACEPTADA').length,
      rejected: this.solicitudes.filter(s => s.estado === 'RECHAZADA').length
    };
  }

  get filteredSolicitudes() {
    let temp = [...this.solicitudes];

    // Filter by Status
    if (this.statusFilter !== 'ALL') {
      temp = temp.filter(s => s.estado === this.statusFilter);
    }

    // Filter by Type
    if (this.typeFilter !== 'ALL') {
      temp = temp.filter(s => s.tipo === this.typeFilter);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(s => 
        s.empresa_nombre?.toLowerCase().includes(q) || 
        s.plan_nombre?.toLowerCase().includes(q) ||
        s.tipo?.toLowerCase().includes(q)
      );
    }

    return temp;
  }

  handleStatusChange(status: string) {
    this.statusFilter = status;
    this.cd.detectChanges();
  }

  handleTypeChange(type: string) {
    this.typeFilter = type;
    this.cd.detectChanges();
  }

  private checkHighlight(data: SolicitudRenovacion[]) {
    if (!this.highlightedId || data.length === 0) return;
    
    if (this.highlightedId !== this.lastOpenedId) {
      const found = data.find(s => s.id === this.highlightedId);
      if (found) {
        this.lastOpenedId = this.highlightedId;
        setTimeout(() => this.abrirDetalle(found), 800);
      }
    }
  }

  cargarEmpresas() {
    this.vendedorService.loadMyEmpresas(true);
    this.vendedorService.getEmpresas().subscribe(data => {
      this.empresas = data;
    });
  }

  cargarPlanes() {
    this.vendedorService.getPlanes().subscribe(data => {
      this.planes = data;
    });
  }

  abrirDetalle(s: SolicitudRenovacion) {
    this.seleccionada = s;
    this.showDetailModal = true;
    this.cd.detectChanges();
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.seleccionada = null;
    this.cd.detectChanges();
  }

  enviarSolicitud(datos: SolicitudRenovacionCreate) {
    this.cargando = true;
    this.api.solicitarRenovacion(datos)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: () => {
          this.uiService.showToast('Solicitud enviada correctamente', 'success');
          this.showCreateModal = false;
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.uiService.showToast(err.error?.detail || 'Error al enviar solicitud', 'danger');
        }
      });
  }
}
