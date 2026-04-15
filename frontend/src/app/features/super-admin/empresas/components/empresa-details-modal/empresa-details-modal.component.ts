import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
   selector: 'app-empresa-details-modal',
   template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-container-premium" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-premium">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-details-premium">
              {{ empresa?.razonSocial?.substring(0, 2).toUpperCase() }}
            </div>
            <div>
              <h2 class="modal-title-premium">{{ empresa?.razonSocial }}</h2>
              <div class="d-flex align-items-center gap-2 mt-1">
                <span class="badge-status-details" [ngClass]="empresa?.activo ? 'status-success' : 'status-danger'">
                  {{ empresa?.activo ? 'ACTIVA' : 'INACTIVA' }}
                </span>
                <span class="badge-plan-details">
                  <i class="bi bi-star-fill me-1 text-warning"></i>
                  {{ empresa?.plan || 'SIN PLAN' }}
                </span>
              </div>
            </div>
          </div>
          <button (click)="onClose.emit()" class="btn-close-premium">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="modal-nav-tabs">
          <button *ngFor="let tab of tabs" 
                  [class.active]="activeTab === tab.id"
                  (click)="activeTab = tab.id"
                  class="nav-tab-btn">
            <i class="bi" [ngClass]="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <div class="modal-body-premium scroll-custom">
          
          <!-- TAB: GENERAL -->
          <div *ngIf="activeTab === 'general'" class="tab-content animate__animated animate__fadeIn animate__faster">
            <div class="info-grid mt-2">
              <div class="info-card-premium">
                <label>Razón Social / RUC</label>
                <div class="value">{{ empresa?.razonSocial }}</div>
                <div class="sub-value font-mono">{{ empresa?.ruc }}</div>
              </div>
              <div class="info-card-premium">
                <label>Nombre Comercial</label>
                <div class="value text-muted" *ngIf="!empresa?.nombreComercial">Sin Datos</div>
                <div class="value" *ngIf="empresa?.nombreComercial">{{ empresa?.nombreComercial }}</div>
              </div>
              <div class="info-card-premium">
                <label>Contacto</label>
                <div class="value">{{ empresa?.email }}</div>
                <div class="sub-value">{{ empresa?.telefono || 'Sin teléfono' }}</div>
              </div>
              <div class="info-card-premium">
                <label>Vendedor</label>
                <div class="value">
                   <i class="bi bi-person-badge me-2 text-corporate"></i>
                   {{ empresa?.vendedorName || 'Gestión Directa' }}
                </div>
              </div>
               <div class="info-card-premium col-span-2">
                <label>Dirección</label>
                <div class="value">{{ empresa?.direccion }}</div>
              </div>
            </div>
          </div>

          <!-- TAB: SUSCRIPCION -->
          <div *ngIf="activeTab === 'suscripcion'" class="tab-content animate__animated animate__fadeIn animate__faster">
             <div class="row g-4 mt-2">
                <div class="col-md-6">
                   <div class="card-details-section">
                      <h4 class="section-title-mini">Estado del Plan</h4>
                      <div class="d-flex justify-content-between align-items-center mb-3">
                         <span class="text-muted">Estado Actual</span>
                         <span class="fw-800" [ngClass]="{
                           'status-text-success': empresa?.suscripcion_estado === 'ACTIVA', 
                           'status-text-warning': empresa?.suscripcion_estado === 'PRUEBA', 
                           'status-text-danger': empresa?.suscripcion_estado === 'CANCELADA' || empresa?.suscripcion_estado === 'VENCIDA', 
                           'text-muted': !empresa?.suscripcion_estado}">{{ empresa?.suscripcion_estado || 'SIN ESTADO' }}</span>
                      </div>
                      <div class="d-flex justify-content-between align-items-center mb-3">
                         <span class="text-muted">Plan Base</span>
                         <span class="fw-800 text-corporate">{{ empresa?.plan || 'INDEFINIDO' }}</span>
                      </div>
                      <div class="d-flex justify-content-between align-items-center mb-3">
                         <span class="text-muted">Vencimiento</span>
                         <span class="fw-800" [class.text-danger]="isExpired(empresa?.fechaVencimiento)" *ngIf="empresa?.fechaVencimiento">
                            {{ empresa?.fechaVencimiento | date:'dd/MM/yyyy' }}
                         </span>
                         <span class="fw-800 text-muted" *ngIf="!empresa?.fechaVencimiento">Sin Datos</span>
                      </div>
                      <div class="d-flex justify-content-between align-items-center">
                         <span class="text-muted">Último Pago</span>
                         <span class="fw-800 status-text-success" *ngIf="empresa?.ultimoPagoFecha; else noPago">
                            {{ empresa?.ultimoPagoMonto | currency:'USD' }} ({{ empresa?.ultimoPagoFecha | date:'dd/MM/yyyy' }})
                         </span>
                         <ng-template #noPago>
                            <span class="badge-status-neutral">Ninguno</span>
                         </ng-template>
                      </div>
                   </div>
                </div>
                
                <div class="col-md-6">
                   <div class="card-details-section">
                      <h4 class="section-title-mini">Uso Actual</h4>
                      <div class="mb-3">
                         <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted fw-bold">Usuarios</span>
                            <span class="fw-800">{{ empresa?.usage?.usuarios || 0 }}/{{ empresa?.limits?.max_usuarios || '-' }}</span>
                         </div>
                         <div class="progress-premium">
                            <div class="progress-bar-premium" [style.width]="getUsagePercent(empresa?.usage?.usuarios, empresa?.limits?.max_usuarios) + '%'"></div>
                         </div>
                      </div>
                      <div class="mb-3">
                         <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted fw-bold">Establecimientos</span>
                            <span class="fw-800">{{ empresa?.usage?.establecimientos || 0 }}/{{ empresa?.limits?.max_establecimientos || '-' }}</span>
                         </div>
                         <div class="progress-premium">
                            <div class="progress-bar-premium" [style.width]="getUsagePercent(empresa?.usage?.establecimientos, empresa?.limits?.max_establecimientos) + '%'"></div>
                         </div>
                      </div>
                       <div class="mb-0">
                         <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted fw-bold">Facturas</span>
                            <span class="fw-800">{{ empresa?.usage?.facturas || 0 }}/{{ empresa?.limits?.max_facturas || '-' }}</span>
                         </div>
                         <div class="progress-premium">
                            <div class="progress-bar-premium" [style.width]="getUsagePercent(empresa?.usage?.facturas, empresa?.limits?.max_facturas) + '%'"></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <!-- TAB: SRI -->
          <div *ngIf="activeTab === 'sri'" class="tab-content animate__animated animate__fadeIn animate__faster">
             <div class="system-card-premium mt-2">
                <div class="d-flex align-items-start gap-3 mb-4">
                   <div class="icon-sq bg-corporate text-white">
                      <i class="bi bi-shield-lock"></i>
                   </div>
                   <div>
                      <h4 class="m-0 fw-800 text-corporate">Firma Electrónica</h4>
                      <p class="text-muted" style="font-size: var(--text-base);">Estado de la facturación ante el SRI</p>
                   </div>
                </div>

                <div class="row g-3">
                   <div class="col-md-6">
                      <div class="info-pill">
                         <label>Estado del Certificado</label>
                         <div class="d-flex align-items-center gap-2">
                            <div class="status-indicator" [class.success]="!isExpired(empresa?.sri_expiracion) && empresa?.sri_expiracion"></div>
                            <span class="fw-bold" *ngIf="empresa?.sri_expiracion">{{ !isExpired(empresa?.sri_expiracion) ? 'Válido' : 'Expirado' }}</span>
                            <span class="fw-bold text-muted" *ngIf="!empresa?.sri_expiracion">Sin registro</span>
                         </div>
                      </div>
                   </div>
                   <div class="col-md-6">
                      <div class="info-pill">
                         <label>Expira el</label>
                         <div class="fw-bold text-dark">{{ (empresa?.sri_expiracion | date:'dd MMM, yyyy') || 'Sin registro' }}</div>
                      </div>
                   </div>
                   <div class="col-md-6">
                      <div class="info-pill">
                         <label>Ambiente SRI</label>
                         <div class="badge-ambient" [class.prod]="empresa?.sri_ambiente === 'PRODUCCION'">
                            {{ empresa?.sri_expiracion ? (empresa?.sri_ambiente || 'PRUEBAS') : 'Sin registro' }}
                         </div>
                      </div>
                   </div>
                   <div class="col-md-6">
                      <div class="info-pill">
                         <label>Obligado Contabilidad</label>
                         <div class="fw-bold">{{ empresa?.obligado_contabilidad ? 'SÍ' : 'NO' }}</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer-premium">
          <button (click)="onClose.emit()" class="btn-cancel-premium">Cerrar</button>
          <button (click)="onClose.emit()" class="btn-submit-premium">Aceptar</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; z-index: 10005;
      padding: 1rem;
    }
    .modal-container-premium {
      background: #ffffff; width: 850px; height: 650px;
      max-width: 95vw; max-height: 90vh; border-radius: 28px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.15);
    }
    .modal-header-premium { padding: 2.5rem; display: flex; justify-content: space-between; align-items: center; }
    .modal-title-premium { font-size: 1.5rem; font-weight: 900; color: var(--primary-color); margin: 0; letter-spacing: -0.5px; }
    .btn-close-premium { background: #f8fafc; border: none; width: 44px; height: 44px; border-radius: 14px; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
    .btn-close-premium:hover { background: #f1f5f9; color: #64748b; }
    
    .avatar-details-premium {
      width: 58px; height: 58px; color: white;
      border-radius: 16px; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: var(--text-lg);
      background: var(--primary-color);
    }

    .badge-status-details {
      font-size: var(--text-xs); font-weight: 800; padding: 0.25rem 0.85rem; border-radius: 100px;
      text-transform: uppercase;
    }
    /* El componente usa los colores de status definidos en styles.css */
    .status-success { background-color: var(--status-success-bg); color: var(--status-success-text); }
    .status-danger { background-color: var(--status-danger-bg); color: var(--status-danger-text); }
    .status-text-success { color: var(--status-success); }
    .status-text-warning { color: var(--status-warning); }
    .status-text-danger { color: var(--status-danger); }
    
    .fw-800, .fw-bold { color: #0f172a !important; }
    .text-muted { color: #64748b !important; }
    
    .badge-status-neutral { 
      background-color: var(--status-neutral-bg); 
      color: var(--status-neutral-text); 
      font-size: var(--text-xs); font-weight: 500; padding: 0.15rem 0.6rem; border-radius: 100px;
    }

    .badge-plan-details { 
      background: #f1f5f9; color: #475569; 
      font-size: var(--text-xs); font-weight: 800; padding: 0.25rem 0.85rem; 
      border-radius: 100px; text-transform: uppercase; 
      display: inline-flex; align-items: center;
    }

    .modal-nav-tabs {
       display: flex; padding: 0 2.5rem; gap: 0.5rem; border-bottom: 1px solid #f1f5f9;
    }
    .nav-tab-btn {
       background: transparent; border: none; padding: 1rem 1.75rem; font-size: var(--text-base);
       font-weight: 700; color: #94a3b8; display: flex; align-items: center; gap: 0.65rem;
       position: relative; transition: all 0.2s;
    }
    .nav-tab-btn i { font-size: 1.15rem; }
    .nav-tab-btn.active { color: var(--primary-color); }
    .nav-tab-btn.active::after {
       content: ""; position: absolute; bottom: 0; left: 0; width: 100%;
       height: 3px; background: var(--primary-color); border-radius: 3px 3px 0 0;
    }

    .modal-body-premium { padding: 2.5rem; overflow-y: auto; flex: 1; }
    
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .info-card-premium { background: #f8fafc; padding: 1.5rem; border-radius: 20px; border: 1px solid #f1f5f9; }
    .info-card-premium label { font-size: var(--text-xs); font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 0.6rem; }
    .info-card-premium .value { font-size: var(--text-md); font-weight: 800; color: #0f172a; }
    .info-card-premium .sub-value { font-size: var(--text-base); color: #64748b; margin-top: 0.3rem; }
    .col-span-2 { grid-column: span 2; }

    .card-details-section { background: #f8fafc; padding: 1.75rem; border-radius: 24px; border: 1px solid #f1f5f9; height: 100%; }
    .section-title-mini { font-size: var(--text-sm); font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 1.5rem; letter-spacing: 0.5px; }
    .progress-premium { height: 8px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
    .progress-bar-premium { height: 100%; background: var(--primary-color); border-radius: 10px; }

    .system-card-premium { background: #f8fafc; border-radius: 28px; padding: 2.5rem; border: 1px solid #f1f5f9; }
    .icon-sq { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; }
    .bg-corporate { background: var(--primary-color); }
    .info-pill { background: white; padding: 1.25rem; border-radius: 18px; border: 1px solid #f1f5f9; }
    .info-pill label { display: block; font-size: var(--text-xs); font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem; }
    
    .status-indicator { width: 12px; height: 12px; border-radius: 50%; background: var(--status-danger); }
    .status-indicator.success { background: var(--status-success); }
    .badge-ambient { font-size: var(--text-sm); font-weight: 800; color: var(--status-warning); }
    .badge-ambient.prod { color: #8b5cf6; }

    .modal-footer-premium { padding: 1.75rem 2.5rem; background: #ffffff; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #f1f5f9; }
    .btn-submit-premium { background: var(--primary-color); color: #ffffff; border: none; padding: 0.85rem 3rem; border-radius: 16px; font-weight: 700; transition: all 0.2s; font-size: var(--text-md); }
    .btn-submit-premium:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.2); }
    .btn-cancel-premium { background: #ffffff; color: #64748b; border: 1px solid #e2e8f0; padding: 0.85rem 2rem; border-radius: 16px; font-weight: 700; font-size: var(--text-md); transition: all 0.2s; }
    .btn-cancel-premium:hover { background: #f8fafc; }
    
    .text-corporate { color: var(--primary-color) !important; }
    .font-mono { font-family: 'DM Mono', monospace; font-size: var(--text-xs); }
    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class EmpresaDetailsModalComponent {
   @Input() empresa: any;
   @Output() onClose = new EventEmitter<void>();

   activeTab: string = 'general';
   tabs = [
      { id: 'general', label: 'General', icon: 'bi-grid-fill' },
      { id: 'suscripcion', label: 'Plan & Uso', icon: 'bi-box' },
      { id: 'sri', label: 'SRI & Facturación', icon: 'bi-shield-check' }
   ];

   getAvatarColor(name: string, opacity: number): string {
      if (!name) return `rgba(148, 163, 184, ${opacity})`;
      const colors = [
         `rgba(99, 102, 241, ${opacity})`, // Indigo
         `rgba(16, 185, 129, ${opacity})`, // Emerald
         `rgba(245, 158, 11, ${opacity})`, // Amber
         `rgba(139, 92, 246, ${opacity})`, // Violet
         `rgba(20, 184, 166, ${opacity})`  // Teal
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
         hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
   }

   isExpired(date: any): boolean {
      if (!date) return false;
      return new Date(date) < new Date();
   }

   getUsagePercent(current: number = 0, max: any = 0): number {
      if (!max || max === '-' || max <= 0) return 0;
      const percent = (current / max) * 100;
      return Math.min(percent, 100);
   }
}
