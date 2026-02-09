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
      
      <div class="px-3 px-md-4 pb-5 animate-fade-in">
        <!-- Loading State -->
        <div *ngIf="loading && !empresa" class="loading-state p-5 text-center">
          <div class="spinner-premium mb-3"></div>
          <p class="text-muted fw-bold">Obteniendo información...</p>
        </div>

        <!-- Content -->
        <div *ngIf="empresa" class="row g-4">
          <div class="col-12 col-xl-8">
            <app-empresa-info-card 
              [empresa]="empresa"
              (onEdit)="showEditModal = true">
            </app-empresa-info-card>
            
            <!-- Additional Operational Info -->
            <div class="operational-stats mt-4 animate-fade-in" style="animation-delay: 0.2s">
              <div class="row g-3">
                <div class="col-md-6 col-lg-3">
                  <div class="stat-mini-card shadow-sm">
                    <span class="label">Establecimientos registrados</span>
                    <span class="value">{{ empresa.establecimientos_count }}</span>
                  </div>
                </div>
                <div class="col-md-6 col-lg-3">
                  <div class="stat-mini-card shadow-sm">
                    <span class="label">Puntos de Emisión</span>
                    <span class="value">{{ empresa.puntos_emision_count }}</span>
                  </div>
                </div>
                <div class="col-md-6 col-lg-3">
                  <div class="stat-mini-card shadow-sm">
                    <span class="label">Ambiente SRI</span>
                    <span class="value" [ngClass]="empresa.sri_ambiente === 'PRODUCCION' ? 'text-success' : 'text-warning'">
                      {{ empresa.sri_ambiente || 'PENDIENTE' }}
                    </span>
                  </div>
                </div>
                <div class="col-md-6 col-lg-3">
                  <div class="stat-mini-card shadow-sm">
                    <span class="label">Firma Electrónica</span>
                    <span class="value" [ngClass]="empresa.firma_expiracion ? 'text-success' : 'text-danger'">
                      {{ empresa.firma_expiracion ? (empresa.firma_expiracion | date:'dd/MM/yy') : 'NO CARGADA' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Info if exists -->
            <div *ngIf="empresa.ultimo_pago_monto" class="payment-banner-lux mt-4 p-3 rounded-4 d-flex align-items-center justify-content-between animate-fade-in">
              <div class="d-flex align-items-center gap-3">
                <div class="payment-icon">
                  <i class="bi bi-credit-card-2-back"></i>
                </div>
                <div>
                  <p class="m-0 fw-bold" style="font-size: 0.9rem;">Último pago registrado</p>
                  <p class="m-0 text-muted" style="font-size: 0.8rem;">Procesado el {{ empresa.ultimo_pago_fecha | date:'dd/MM/yyyy' }}</p>
                </div>
              </div>
              <div class="text-end">
                <span class="badge bg-success-subtle text-success rounded-pill px-3 py-2 fw-bold">
                  {{ empresa.ultimo_pago_monto | currency:'USD' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="col-12 col-xl-4">
            <div class="sidebar-wrapper d-flex flex-column gap-4">
              
              <!-- Account Status Card -->
              <div class="summary-card-lux p-4 rounded-4 shadow-sm border-0">
                <h5 class="section-title mb-3">Estado de Suscripción</h5>
                <div class="status-indicator mb-3" [ngClass]="empresa.activo ? 'status-active' : 'status-inactive'">
                  <div class="pulse-dot"></div>
                  <span class="text-uppercase" style="font-size: 0.75rem; letter-spacing: 0.5px;">
                    {{ empresa.activo ? (empresa.suscripcion_estado === 'active' || empresa.suscripcion_estado === 'ACTIVA' ? 'Suscripción Activa' : (empresa.suscripcion_estado || 'Activo')) : 'Inactivo' }}
                  </span>
                </div>
                
                <div class="details-list">
                  <div class="detail-item">
                    <span class="label">Plan Actual:</span>
                    <span class="value text-primary fw-800">{{ empresa.plan_nombre || 'Plan Gratuito' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Fecha Registro:</span>
                    <span class="value">{{ (empresa.created_at | date:'dd MMM, yyyy') || 'N/A' }}</span>
                  </div>
                  <div class="detail-item" *ngIf="empresa.fecha_fin">
                    <span class="label">Próximo Vencimiento:</span>
                    <span class="value text-danger">{{ empresa.fecha_fin | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
              </div>

              <!-- Usage Limits Card -->
              <div class="summary-card-lux p-4 rounded-4 shadow-sm border-0 secondary-soft">
                <h5 class="section-title mb-3">Capacidad del Plan</h5>
                
                <div class="usage-item mb-3">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="caption">Comprobantes Mensuales</span>
                    <span class="fw-bold fs-7">{{ empresa.max_facturas_mes || 'Sin límite' }}</span>
                  </div>
                  <div class="progress" style="height: 6px; border-radius: 10px; background: #e2e8f0;">
                    <div class="progress-bar bg-primary" role="progressbar" 
                         [style.width.%]="empresa.max_facturas_mes ? 15 : 100" 
                         style="border-radius: 10px;"></div>
                  </div>
                </div>

                <div class="usage-item">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="caption">Colaboradores</span>
                    <span class="fw-bold fs-7">{{ empresa.establecimientos_count }} / {{ empresa.max_establecimientos || '1' }} Locales</span>
                  </div>
                  <div class="progress" style="height: 6px; border-radius: 10px; background: #e2e8f0;">
                    <div class="progress-bar bg-info" role="progressbar" 
                         [style.width.%]="empresa.max_establecimientos ? (empresa.establecimientos_count / empresa.max_establecimientos * 100) : 100" 
                         style="border-radius: 10px;"></div>
                  </div>
                </div>

                <hr class="my-3 opacity-10">
                
                <div class="info-row-lux">
                  <div class="icon-box bg-white text-success">
                    <i class="bi bi-patch-check"></i>
                  </div>
                  <div>
                    <p class="caption m-0">Tipo Contribuyente</p>
                    <p class="main-info m-0" style="font-size: 0.85rem;">{{ empresa.tipo_contribuyente || 'No definido' }}</p>
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
      overflow-x: hidden;
    }
    
    .header-premium {
      background: white;
      border-radius: 0 0 32px 32px;
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.04);
      border-bottom: 1px solid #f1f5f9;
    }

    .brand-icon-bg {
      width: 60px; height: 60px;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
    }
    
    .page-title {
      font-size: 1.75rem; font-weight: 800;
      color: #0f172a; letter-spacing: -0.5px;
    }

    .text-subtitle {
      font-size: 0.95rem; color: #64748b; font-weight: 500;
    }

    .btn-refresh-lux {
      background: white; border: 1.5px solid #e2e8f0;
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; transition: all 0.3s; font-size: 1.2rem;
    }
    .btn-refresh-lux:hover {
      background: #1e293b; color: white; border-color: #1e293b; transform: rotate(180deg);
    }
    .spinning i { animation: spin 0.8s linear infinite; }

    /* Summary Cards */
    .summary-card-lux {
      background: white;
      border: 1px solid #f1f5f9;
    }
    .secondary-soft { background: #f1f5f9; }

    .section-title { font-size: 0.95rem; font-weight: 800; color: #1e293b; }
    
    .status-indicator {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-radius: 12px; font-weight: 700; font-size: 0.85rem;
    }
    .status-active { background: #ecfdf5; color: #059669; }
    .status-inactive { background: #fef2f2; color: #dc2626; }

    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%; background: currentColor;
      animation: pulse 2s infinite;
    }

    .details-list { display: flex; flex-direction: column; gap: 8px; }
    .detail-item { display: flex; justify-content: space-between; font-size: 0.85rem; }
    .detail-item .label { color: #64748b; font-weight: 500; }
    .detail-item .value { color: #1e293b; font-weight: 700; }

    .info-row-lux { display: flex; align-items: center; gap: 12px; }
    .icon-box {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .caption { font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .main-info { font-size: 0.9rem; font-weight: 700; color: #1e293b; }

    /* Operational Stats */
    .stat-mini-card {
      background: white;
      padding: 1.25rem;
      border-radius: 20px;
      border: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-mini-card .label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .stat-mini-card .value {
      font-size: 1rem;
      font-weight: 800;
      color: #1e293b;
    }

    /* Usage items */
    .usage-item .caption { font-size: 0.7rem; margin-bottom: 4px; display: block; }
    .fs-7 { font-size: 0.85rem !important; }

    /* Payment Banner */
    .payment-banner-lux {
      background: white; border: 1px solid #ecfdf5;
    }
    .payment-icon {
      width: 40px; height: 40px; background: #ecfdf5; color: #059669;
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem;
    }

    /* states */
    .spinner-premium {
      width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: #1e293b;
      border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;
    }

    .empty-icon-wrapper {
      font-size: 3rem; color: #e2e8f0;
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
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
}
