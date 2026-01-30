import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vendedor, VendedorService } from '../../services/vendedor.service';

@Component({
  selector: 'app-vendedor-details-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-content-premium shadow-premium" (click)="$event.stopPropagation()">
        
        <div class="modal-header-premium" *ngIf="vendedor">
          <div class="d-flex align-items-center">
            <div class="vendedor-avatar-lg me-3">
                {{ (vendedor.nombres || vendedor.nombre || '').substring(0, 2).toUpperCase() }}
            </div>
            <div>
                <h2 class="modal-title-premium text-dark fw-bold mb-0">{{ vendedor.nombres || vendedor.nombre }}</h2>
                <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="badge-status" [class.active]="vendedor.activo">
                        {{ vendedor.activo ? 'Vendedor Activo' : 'Vendedor Bloqueado' }}
                    </span>
                    <small class="text-muted"><i class="bi bi-envelope me-1"></i>{{ vendedor.email }}</small>
                </div>
            </div>
          </div>
          <button (click)="onClose.emit()" class="btn-close-premium">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-premium" *ngIf="vendedor">
          <!-- Performance Grid -->
          <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="perf-card">
                    <span class="label">Empresas Asignadas</span>
                    <!-- Priorizar el conteo de la lista cargada en tiempo real -->
                    <h4 class="value mb-0">
                        {{ loading ? (vendedor.empresas_asignadas || vendedor.empresasAsignadas || 0) : companies.length }}
                    </h4>
                </div>
            </div>
            <div class="col-md-4">
                <div class="perf-card">
                    <span class="label text-success">Conversión</span>
                    <h4 class="value mb-0">
                        {{ getConversion() | percent }}
                    </h4>
                </div>
            </div>
            <div class="col-md-4">
                <div class="perf-card">
                    <span class="label text-primary">Ingresos Brutos</span>
                    <h4 class="value mb-0">{{ (vendedor.ingresos_generados || vendedor.ingresosGenerados || 0) | currency }}</h4>
                </div>
            </div>
          </div>

          <!-- Section: Commercial Configuration -->
          <div class="row g-3 mb-4">
            <div class="col-md-6">
                <div class="details-section h-100">
                    <h6 class="section-title mb-3"><i class="bi bi-cash-coin me-2"></i>Comisiones</h6>
                    <div class="comision-info">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted small">Tipo:</span>
                            <span class="fw-bold small">{{ vendedor.tipoComision }}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted small">Venta Inicial:</span>
                            <span class="fw-bold text-dark">{{ vendedor.porcentajeComisionInicial }}{{ vendedor.tipoComision === 'PORCENTAJE' ? '%' : '$' }}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span class="text-muted small">Recurrente:</span>
                            <span class="fw-bold text-primary">{{ vendedor.porcentajeComisionRecurrente }}{{ vendedor.tipoComision === 'PORCENTAJE' ? '%' : '$' }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="details-section h-100">
                    <h6 class="section-title mb-3"><i class="bi bi-shield-lock me-2"></i>Permisos</h6>
                    <div class="permissions-list">
                        <div class="permission-pill" [class.enabled]="vendedor.puede_crear_empresas">
                            <i class="bi" [class]="vendedor.puede_crear_empresas ? 'bi-check-circle-fill text-success' : 'bi-x-circle text-muted'"></i>
                            <span>Crear Empresas</span>
                        </div>
                        <div class="permission-pill" [class.enabled]="vendedor.puede_acceder_empresas">
                            <i class="bi" [class]="vendedor.puede_acceder_empresas ? 'bi-check-circle-fill text-success' : 'bi-x-circle text-muted'"></i>
                            <span>Acceder Datos</span>
                        </div>
                        <div class="permission-pill" [class.enabled]="vendedor.puede_gestionar_planes">
                            <i class="bi" [class]="vendedor.puede_gestionar_planes ? 'bi-check-circle-fill text-success' : 'bi-x-circle text-muted'"></i>
                            <span>Gestionar Planes</span>
                        </div>
                        <div class="permission-pill" [class.enabled]="vendedor.puede_ver_reportes">
                            <i class="bi" [class]="vendedor.puede_ver_reportes ? 'bi-check-circle-fill text-success' : 'bi-x-circle text-muted'"></i>
                            <span>Ver Reportes</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <!-- Section: Managed Companies -->
          <div class="details-section">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="section-title mb-0">Empresas bajo su gestión</h6>
                <span class="badge bg-light text-dark rounded-pill">{{ companies.length }} Empresas</span>
            </div>
            
            <div class="companies-container custom-scrollbar">
                <div *ngIf="loading" class="text-center py-5">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <p class="small text-muted mt-2">Cargando empresas...</p>
                </div>

                <div *ngIf="!loading && companies.length === 0" class="text-center py-5 bg-light rounded-4">
                    <i class="bi bi-building fs-3 text-muted d-block mb-2"></i>
                    <p class="small text-muted mb-0">Este vendedor aún no tiene empresas asignadas.</p>
                </div>

                <div *ngIf="!loading && companies.length > 0" class="row g-2">
                    <div *ngFor="let c of companies" class="col-12">
                        <div class="company-mini-card">
                            <div class="d-flex align-items-center">
                                <div class="company-icon me-3">
                                    <i class="bi bi-building"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <h6 class="mb-0 fw-bold company-name">{{ c.razon_social }}</h6>
                                        <span class="badge-mini" [ngClass]="c.activo ? 'active' : 'inactive'">
                                            {{ c.activo ? 'ACTIVA' : 'INACTIVA' }}
                                        </span>
                                    </div>
                                    <div class="d-flex gap-3 mt-1">
                                        <small class="text-muted"><i class="bi bi-fingerprint me-1"></i>{{ c.ruc }}</small>
                                        <small class="text-muted"><i class="bi bi-calendar-event me-1"></i>{{ c.fecha_registro | date:'shortDate' }}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div class="modal-footer-premium">
          <button (click)="onClose.emit()" class="btn-primary-premium px-5">Cerrar Detalle</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.35); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; z-index: 10001;
    }
    .modal-content-premium {
      background: #ffffff; width: 100%; max-width: 680px;
      border-radius: 32px; overflow: hidden; display: flex; flex-direction: column;
      max-height: 90vh;
    }
    .modal-header-premium {
      padding: 2rem; display: flex; justify-content: space-between; align-items: center;
      background: #fff; border-bottom: 1px solid #f8fafc;
    }
    .vendedor-avatar-lg {
      width: 64px; height: 64px;
      background: #161d35; color: white;
      border-radius: 18px; display: flex;
      align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.5rem;
    }
    .badge-status {
      font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 8px;
      display: inline-block; text-transform: uppercase;
    }
    .badge-status.active { background: #dcfce7; color: #15803d; }
    
    .modal-body-premium { 
      padding: 2rem; 
      overflow-y: auto;
    }
    
    .perf-card {
        background: #f8fafc; border: 1px solid #f1f5f9;
        padding: 1.25rem; border-radius: 20px; text-align: center;
        transition: transform 0.2s;
    }
    .perf-card:hover { transform: translateY(-5px); }
    .perf-card .label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 5px; }
    .perf-card .value { font-size: 1.5rem; font-weight: 800; color: #1e293b; }

    .details-section {
        background: #ffffff; border: 1px solid rgba(0, 0, 0, 0.05);
        padding: 1.5rem; border-radius: 24px;
    }
    .section-title { 
        font-size: 0.7rem; font-weight: 800; color: #94a3b8; 
        text-transform: uppercase; letter-spacing: 1px;
        display: flex; align-items: center;
    }
    
    .comision-info {
        padding: 0.5rem 0;
    }
    
    .permissions-list {
        display: grid; grid-template-columns: 1fr; gap: 0.5rem;
    }
    .permission-pill {
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.5rem 0.75rem; border-radius: 10px;
        font-size: 0.8rem; font-weight: 600; color: #64748b;
        background: #f8fafc; border: 1px solid rgba(0,0,0,0.02);
    }
    .permission-pill.enabled {
        color: #1e293b;
        background: white;
        border-color: rgba(22, 29, 53, 0.05);
    }
    
    .companies-container {
        max-height: 250px;
        overflow-y: auto;
        padding-right: 5px;
    }

    .company-mini-card {
        background: #ffffff;
        border: 1px solid #f1f5f9;
        padding: 1rem;
        border-radius: 16px;
        transition: all 0.2s;
    }
    .company-mini-card:hover { border-color: #161d35; background: #f8fafc; }
    
    .company-icon {
        width: 40px; height: 40px;
        background: #f1f5f9;
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.2rem; color: #64748b;
    }

    .company-name { font-size: 0.9rem; color: #1e293b; }
    
    .badge-mini {
        font-size: 0.6rem; font-weight: 800;
        padding: 2px 6px; border-radius: 4px;
    }
    .badge-mini.active { background: #dcfce7; color: #15803d; }
    .badge-mini.inactive { background: #fee2e2; color: #b91c1c; }

    .btn-primary-premium {
      background: #161d35; color: white; border: none; padding: 0.85rem 2rem;
      border-radius: 14px; font-weight: 700; transition: all 0.2s;
    }
    .btn-close-premium {
      background: none; border: none; font-size: 1.5rem; color: #94a3b8;
    }
    .modal-footer-premium {
      display: flex; justify-content: center; padding: 1.5rem 2rem;
      background: #f8fafc; border-top: 1px solid #f1f5f9;
    }
    .shadow-premium { box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25); }
    
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class VendedorDetailsModalComponent implements OnInit {
  @Input() vendedor!: Vendedor;
  @Output() onClose = new EventEmitter<void>();

  companies: any[] = [];
  loading: boolean = true;

  constructor(
    private vendedorService: VendedorService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.loading = true;
    this.vendedorService.getVendedorEmpresas(this.vendedor.id).subscribe({
      next: (data) => {
        this.companies = data;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  getConversion(): number {
    const total = this.loading ? (this.vendedor.empresasAsignadas || 0) : this.companies.length;
    if (total === 0) return 0;

    const activas = this.loading
      ? (this.vendedor.empresasActivas || 0)
      : this.companies.filter(c => c.activo).length;

    return activas / total;
  }
}
