import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { finalize, map, takeUntil } from 'rxjs/operators';

// Components
import { RenovacionesStatsComponent } from './components/renovaciones-stats/renovaciones-stats.component';
import { RenovacionesActionsComponent } from './components/renovaciones-actions/renovaciones-actions.component';
import { RenovacionesTableComponent } from './components/renovaciones-table/renovaciones-table.component';
import { RenovacionDetailModalComponent } from './components/modals/renovacion-detail-modal.component';
import { RenovacionProcessModalComponent } from './components/modals/renovacion-process-modal.component';
import { RenovacionRejectModalComponent } from './components/modals/renovacion-reject-modal.component';

// Services
import { RenovacionesApiService } from '../../../core/api/renovaciones-api.service';
import { SolicitudRenovacion, SolicitudRenovacionProcess } from '../../../domain/models/renovacion.model';
import { UiService } from '../../../shared/services/ui.service';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { UserRole } from '../../../domain/enums/role.enum';

@Component({
  selector: 'app-renovaciones-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RenovacionesStatsComponent,
    RenovacionesActionsComponent,
    RenovacionesTableComponent,
    RenovacionDetailModalComponent,
    RenovacionProcessModalComponent,
    RenovacionRejectModalComponent
  ],
  template: `
    <div class="renovaciones-page-container animate__animated animate__fadeIn">
      
      <!-- 1. Stats -->
      <app-renovaciones-stats [stats]="stats"></app-renovaciones-stats>

      <!-- 2. Actions (Search & Status Filter) -->
      <app-renovaciones-actions
        [(searchQuery)]="searchQuery"
        [currentStatus]="statusFilter"
        (onStatusChange)="statusFilter = $event"
      ></app-renovaciones-actions>

      <!-- 3. Table -->
      <app-renovaciones-table
        [solicitudes]="filteredSolicitudes"
        [highlightedId]="highlightedId"
        [isVendedor]="isVendedor"
        (onVerDetalle)="abrirDetalle($event)"
        (onRechazar)="abrirRechazo($event)"
      ></app-renovaciones-table>

      <!-- 4. Modals -->
      <app-renovacion-detail-modal
        *ngIf="showDetailModal"
        [seleccionada]="seleccionada"
        [isVendedor]="isVendedor"
        (onClose)="showDetailModal = false"
        (onProcess)="irAProcesar()"
      ></app-renovacion-detail-modal>

        <app-renovacion-process-modal
        *ngIf="showProcessModal"
        [seleccionada]="seleccionada"
        [cargando]="cargando"
        (onClose)="showProcessModal = false"
        (onConfirm)="procesar('ACEPTADA', $event)"
        (onRejectAction)="cerrarYRechazar()"
      ></app-renovacion-process-modal>

      <app-renovacion-reject-modal
        *ngIf="showRejectModal"
        [(motivo)]="motivoRechazo"
        [cargando]="cargando"
        (onClose)="showRejectModal = false"
        (onConfirm)="procesar('RECHAZADA')"
      ></app-renovacion-reject-modal>

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
      position: relative;
    }
  `]
})
export class RenovacionesAdminPage implements OnInit, OnDestroy {
  solicitudes: SolicitudRenovacion[] = [];
  seleccionada: SolicitudRenovacion | null = null;
  motivoRechazo: string = '';
  searchQuery: string = '';
  cargando: boolean = false;
  isVendedor: boolean = false;
  highlightedId: string | null = null;
  statusFilter: string = 'ALL';

  // Stats
  stats = { pending: 0, accepted: 0, rejected: 0 };

  // UI States
  showDetailModal = false;
  showProcessModal = false;
  showRejectModal = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private api: RenovacionesApiService,
    private uiService: UiService,
    private authFacade: AuthFacade,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {
    this.isVendedor = this.authFacade.getUserRole() === UserRole.VENDEDOR;
  }

  private lastOpenedId: string | null = null;

  ngOnInit() {
    this.api.solicitudes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.solicitudes = data;
        this.calculateStats();
        this.checkHighlight(data);
        this.cd.detectChanges();
      });

    this.cargarSolicitudes();

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
    this.api.listarSolicitudes().subscribe();
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

    // Filter by Search Query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(s => 
        s.empresa_nombre?.toLowerCase().includes(q) || 
        s.plan_nombre?.toLowerCase().includes(q)
      );
    }

    return temp;
  }

  private checkHighlight(data: SolicitudRenovacion[]) {
    if (!this.highlightedId || data.length === 0) return;
    
    if (this.highlightedId !== this.lastOpenedId) {
      const found = data.find(s => s.id === this.highlightedId);
      if (found) {
        this.lastOpenedId = this.highlightedId;
        setTimeout(() => this.abrirDetalle(found), 500);
      }
    }
  }

  abrirDetalle(s: SolicitudRenovacion) {
    this.seleccionada = s;
    this.showDetailModal = true;
    this.cd.detectChanges();
  }

  abrirRechazo(s: SolicitudRenovacion) {
    this.seleccionada = s;
    this.motivoRechazo = '';
    this.showRejectModal = true;
    this.cd.detectChanges();
  }

  irAProcesar() {
    this.showDetailModal = false;
    setTimeout(() => {
      this.showProcessModal = true;
      this.cd.detectChanges();
    }, 100);
  }

  cerrarYRechazar() {
    this.showProcessModal = false;
    setTimeout(() => {
      this.showRejectModal = true;
      this.cd.detectChanges();
    }, 100);
  }

  procesar(estado: 'ACEPTADA' | 'RECHAZADA', extraData?: any) {
    if (!this.seleccionada) return;

    this.cargando = true;
    const data: SolicitudRenovacionProcess = {
      estado,
      motivo_rechazo: estado === 'RECHAZADA' ? this.motivoRechazo : undefined,
      metodo_pago: extraData?.metodo_pago,
      numero_comprobante: extraData?.numero_comprobante
    };

    this.api.procesarSolicitud(this.seleccionada.id, data)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: () => {
          this.uiService.showToast(
            estado === 'ACEPTADA' ? 'Renovación aprobada con éxito' : 'Solicitud rechazada con éxito',
            estado === 'ACEPTADA' ? 'success' : 'warning'
          );
          
          this.showProcessModal = false;
          this.showRejectModal = false;
          this.seleccionada = null;
          this.motivoRechazo = '';
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.uiService.showToast(err.error?.detail || 'Error al procesar', 'danger');
        }
      });
  }
}
