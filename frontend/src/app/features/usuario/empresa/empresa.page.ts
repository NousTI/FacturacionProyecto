import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { EmpresaInfoCardComponent } from './components/empresa-info-card/empresa-info-card.component';
import { EditEmpresaModalComponent } from './components/edit-empresa-modal/edit-empresa-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

import { EmpresaService } from './services/empresa.service';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { UiService } from '../../../shared/services/ui.service';
import { Empresa } from '../../../domain/models/empresa.model';

@Component({
  selector: 'app-empresa-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EmpresaInfoCardComponent,
    EditEmpresaModalComponent,
    ToastComponent
  ],
  template: `
    <div class="empresa-page-container">
      
      <div class="container-fluid px-4 py-4">
        <!-- Loading State -->
        <div *ngIf="loading && !empresa" class="loading-state p-5 text-center">
          <div class="spinner-premium mb-3"></div>
          <p class="text-muted fw-bold">Obteniendo información...</p>
        </div>

        <!-- Content -->
        <div *ngIf="empresa">
          
          <!-- Banner de Inactividad -->
          <div *ngIf="!empresa.activo" class="alert alert-danger shadow-sm rounded-4 mb-4 p-4 d-flex align-items-center gap-3 animate__animated animate__fadeIn">
            <i class="bi bi-exclamation-octagon-fill fs-1"></i>
            <div>
              <h4 class="alert-heading fw-bold mb-1">Empresa Inhabilitada</h4>
              <p class="mb-0 fw-medium">Esta empresa ha sido desactivada por el administrador del sistema. El acceso a los módulos operativos está restringido temporalmente. Por favor, contacte a soporte para más información.</p>
            </div>
          </div>

          <div class="row g-4">
          <div class="col-12 col-xl-8">
            <app-empresa-info-card 
              [empresa]="empresa"
              (onEdit)="showEditModal = true">
            </app-empresa-info-card>
            
            <!-- STATS Compact Row -->
            <div class="stats-compact-row mt-4">
              <div class="stat-item-mini">
                <div class="icon-circle" style="background: rgba(22, 29, 53, 0.05); color: #161d35;">
                  <i class="bi bi-houses"></i>
                </div>
                <div class="stat-info">
                  <span class="stat-label">Establecimientos</span>
                  <span class="stat-value">{{ empresa.establecimientos_count }}</span>
                </div>
              </div>

              <div class="stat-divider"></div>

              <div class="stat-item-mini">
                <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                  <i class="bi bi-broadcast-pin"></i>
                </div>
                <div class="stat-info">
                  <span class="stat-label">Puntos Emisión</span>
                  <span class="stat-value">{{ empresa.puntos_emision_count }}</span>
                </div>
              </div>

              <div class="stat-divider"></div>

              <div class="stat-item-mini">
                <div class="icon-circle" [style.background]="empresa.sri_ambiente === 'PRODUCCION' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'" 
                                    [style.color]="empresa.sri_ambiente === 'PRODUCCION' ? '#10b981' : '#f59e0b'">
                  <i class="bi bi-cloud-check"></i>
                </div>
                <div class="stat-info">
                  <span class="stat-label">Ambiente SRI</span>
                  <span class="stat-value text-uppercase" style="font-size: 1rem;">{{ empresa.sri_ambiente || 'PENDIENTE' }}</span>
                </div>
              </div>

              <div class="stat-divider d-none d-lg-block"></div>

              <div class="stat-item-mini">
                <div class="icon-circle" [style.background]="empresa.firma_expiracion ? 'rgba(37, 99, 235, 0.1)' : 'rgba(239, 68, 68, 0.1)'" 
                                    [style.color]="empresa.firma_expiracion ? '#2563eb' : '#ef4444'">
                  <i class="bi bi-key"></i>
                </div>
                <div class="stat-info">
                  <span class="stat-label">Firma Elec.</span>
                  <span class="stat-value text-nowrap">{{ empresa.firma_expiracion ? (empresa.firma_expiracion | date:'dd/MM/yy') : 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Payment Info if exists -->
            <div *ngIf="empresa.ultimo_pago_monto" class="payment-banner-lux mt-4">
              <div class="d-flex align-items-center gap-3">
                <div class="payment-icon">
                  <i class="bi bi-patch-check-fill"></i>
                </div>
                <div>
                  <p class="m-0 fw-800" style="font-size: 0.95rem; color: #1e293b;">Último pago registrado</p>
                  <p class="m-0 text-muted" style="font-size: 0.8rem; font-weight: 500;">Procesado el {{ empresa.ultimo_pago_fecha | date:'dd MMM, yyyy' }}</p>
                </div>
              </div>
              <div class="text-end">
                <span class="badge-premium-success">
                  {{ empresa.ultimo_pago_monto | currency:'USD' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="col-12 col-xl-4">
            <div class="sidebar-wrapper d-flex flex-column gap-4">
              
              <!-- Subscription Status -->
              <div class="summary-card-lux">
                <div class="card-header-mini">
                  <h5 class="section-title m-0">Estado de Suscripción</h5>
                  <div class="status-badge" [ngClass]="getStatusClass(empresa.suscripcion_estado)">
                    <span class="pulse-dot"></span>
                    {{ empresa.suscripcion_estado || (empresa.activo ? 'ACTIVA' : 'INACTIVA') }}
                  </div>
                </div>
                
                <div class="card-content-lux">
                  <div class="detail-row">
                    <span class="label">Plan Actual</span>
                    <span class="value text-primary">{{ empresa.plan_nombre || 'Plan Gratuito' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Desde</span>
                    <span class="value">{{ (empresa.created_at | date:'dd MMM, yyyy') || 'N/A' }}</span>
                  </div>
                  <div class="detail-row" *ngIf="empresa.fecha_fin">
                    <span class="label">Vencimiento</span>
                    <span class="value" [class.text-danger]="isOverdue(empresa.fecha_fin)">
                      {{ empresa.fecha_fin | date:'dd MMM, yyyy' }}
                      <i *ngIf="isOverdue(empresa.fecha_fin)" class="bi bi-exclamation-triangle-fill ms-1"></i>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Usage Limits -->
              <div class="summary-card-lux secondary-soft">
                <h5 class="section-title mb-3">Límites y Capacidad</h5>
                
                <div class="usage-meter mb-4">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="meter-label">Comprobantes / mes</span>
                    <span class="meter-value">{{ empresa.max_facturas_mes || '∞' }}</span>
                  </div>
                  <div class="progress-premium">
                    <div class="progress-bar-lux" [style.width.%]="empresa.max_facturas_mes ? 15 : 100"></div>
                  </div>
                </div>

                <div class="usage-meter">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="meter-label">Establecimientos</span>
                    <span class="meter-value">{{ empresa.establecimientos_count }} / {{ empresa.max_establecimientos || '1' }}</span>
                  </div>
                  <div class="progress-premium">
                    <div class="progress-bar-lux bg-info" [style.width.%]="empresa.max_establecimientos ? (empresa.establecimientos_count / empresa.max_establecimientos * 100) : 100"></div>
                  </div>
                </div>

                <div class="info-footer-lux mt-4">
                   <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-shield-check text-success fs-5"></i>
                      <span class="text-muted" style="font-size: 0.8rem; font-weight: 600;">Contribuyente: <b>{{ empresa.tipo_contribuyente || 'No definido' }}</b></span>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && !empresa" class="empty-state shadow-sm rounded-4 p-5 text-center bg-white">
          <div class="empty-icon-wrapper mb-3">
            <i class="bi bi-building-exclamation"></i>
          </div>
          <h3>No se encontró información</h3>
          <p class="text-muted">No pudimos recuperar los datos de la empresa vinculada a este usuario.</p>
          <button class="btn btn-outline-primary rounded-pill px-4" (click)="refreshData()">Reintentar</button>
        </div>
      </div>

      <!-- Modals -->
      <app-edit-empresa-modal
        *ngIf="showEditModal && empresa"
        [empresa]="empresa"
        [loading]="isSaving"
        (onSave)="handleUpdate($event)"
        (onClose)="showEditModal = false">
      </app-edit-empresa-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .empresa-page-container {
      min-height: 100vh;
      background: #f8fafc;
    }

    /* STATS ROW - Inspired by facturacion */
    .stats-compact-row {
      background: white;
      border-radius: 20px;
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
    }
    .stat-item-mini {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }
    .icon-circle {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.2;
    }
    .stat-divider {
      width: 1px;
      height: 35px;
      background: #f1f5f9;
      margin: 0 1.5rem;
    }

    /* Sidebar Cards */
    .summary-card-lux {
      background: white;
      border-radius: 24px;
      padding: 2rem;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    }
    .secondary-soft { background: #f1f5f9; border: none; }
    
    .card-header-mini {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .section-title {
      font-size: 0.9rem;
      font-weight: 900;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 800;
    }
    .status-active { background: #ecfdf5; color: #10b981; }
    .status-inactive { background: #fef2f2; color: #ef4444; }
    .status-vencida { background: #fff7ed; color: #f59e0b; }
    .status-cancelada { background: #f1f5f9; color: #64748b; }
    .status-suspendida { background: #fee2e2; color: #b91c1c; }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f8fafc;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-row .label { font-size: 0.85rem; color: #64748b; font-weight: 500; }
    .detail-row .value { font-size: 0.85rem; color: #1e293b; font-weight: 800; }

    /* Usage Meter */
    .meter-label { font-size: 0.75rem; color: #64748b; font-weight: 700; }
    .meter-value { font-size: 0.75rem; color: #1e293b; font-weight: 800; }
    .progress-premium {
      height: 6px;
      background: #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }
    .progress-bar-lux {
      height: 100%;
      background: #161d35;
      border-radius: 10px;
      transition: width 0.3s ease;
    }

    /* Payment Banner */
    .payment-banner-lux {
      background: white;
      border-radius: 20px;
      padding: 1.25rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    }
    .payment-icon {
      width: 44px;
      height: 44px;
      background: #ecfdf5;
      color: #10b981;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }
    .badge-premium-success {
      background: #ecfdf5;
      color: #10b981;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.9rem;
    }

    .fw-800 { font-weight: 800; }

    .spinner-premium {
      width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: #1e293b;
      border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 992px) {
      .stats-compact-row {
        flex-wrap: wrap;
        gap: 1.25rem;
        padding: 1.25rem;
      }
      .stat-divider { display: none; }
      .stat-item-mini { min-width: 45%; }
    }
  `]
})
export class EmpresaPage implements OnInit {
  empresa: Empresa | null = null;
  loading = true;
  isSaving = false;
  showEditModal = false;

  constructor(
    private empresaService: EmpresaService,
    private authFacade: AuthFacade,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.uiService.setPageHeader('Configuración de Empresa', 'Gestiona la información legal y operativa de tu negocio');
    this.loadEmpresa();
  }

  loadEmpresa(): void {
    const user = this.authFacade.getUser() as any;

    // El ID puede venir como empresa_id (login) o empresa.id (perfil)
    const empresaId = user?.empresa_id || user?.empresa?.id;

    if (empresaId) {
      this.fetchEmpresaData(empresaId);
    } else {
      this.loading = false;
      this.uiService.showError('No se encontró información de la empresa vinculada a tu cuenta', 'Error de Perfil');
    }
  }

  fetchEmpresaData(id: string): void {
    if (!id || id === 'undefined' || id === 'null') return;

    this.loading = true;
    console.log('[EmpresaPage] Solicitando datos para ID:', id);

    this.empresaService.getEmpresa(id).pipe(
      finalize(() => {
        this.loading = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (response: any) => {
        console.log('[EmpresaPage] Datos recibidos del backend:', response);
        // El backend devuelve un RespuestaBase, la data real está en 'detalles'
        this.empresa = response.detalles || response;
      },
      error: (err: any) => {
        console.error('[EmpresaPage] Error al obtener datos:', err);
        this.uiService.showError(err, 'Error al cargar información de la empresa');
      }
    });
  }

  handleUpdate(formData: any): void {
    if (!this.empresa) return;

    this.isSaving = true;

    // Solo enviar campos permitidos para actualización para evitar errores 422
    const updatableFields = [
      'ruc', 'razon_social', 'nombre_comercial', 'email', 'telefono',
      'direccion', 'logo_url', 'tipo_contribuyente', 'obligado_contabilidad'
    ];

    const payload: any = {};
    updatableFields.forEach(field => {
      if (formData[field] !== undefined) {
        // Limpiar espacios en blanco para evitar errores de validación (especialmente en RUC y Teléfono)
        if (typeof formData[field] === 'string') {
          payload[field] = formData[field].trim();
        } else {
          payload[field] = formData[field];
        }
      }
    });

    this.empresaService.updateEmpresa(this.empresa.id, payload).pipe(
      finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (response: any) => {
        this.empresa = response.detalles || response;
        this.uiService.showToast('Información de la empresa actualizada correctamente', 'success');
        this.showEditModal = false;
      },
      error: (err: any) => {
        this.uiService.showError(err, 'Error al actualizar información');
      }
    });
  }

  refreshData(): void {
    this.loadEmpresa();
  }

  getStatusClass(estado: string | null | undefined): string {
    if (!estado) return 'status-active';
    const s = estado.toLowerCase();
    if (s === 'activa') return 'status-active';
    if (s === 'vencida') return 'status-vencida';
    if (s === 'cancelada') return 'status-cancelada';
    if (s === 'suspendida') return 'status-suspendida';
    return 'status-inactive';
  }

  isOverdue(fecha: string | null): boolean {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  }
}
