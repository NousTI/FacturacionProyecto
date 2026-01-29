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
            <div class="avatar-details-premium" [style.background]="getAvatarColor(empresa?.razonSocial, 1)">
              {{ empresa?.razonSocial?.substring(0, 2).toUpperCase() }}
            </div>
            <div>
              <h2 class="modal-title-premium">{{ empresa?.razonSocial }}</h2>
              <div class="d-flex align-items-center gap-2 mt-1">
                <span class="badge-status-details" [ngClass]="empresa?.activo ? 'active' : 'inactive'">
                  {{ empresa?.activo ? 'ACTIVA' : 'INACTIVA' }}
                </span>
                <span class="badge-plan-details">{{ empresa?.plan || 'SIN PLAN' }}</span>
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
                <div class="value text-muted" *ngIf="!empresa?.nombreComercial">S/D</div>
                <div class="value">{{ empresa?.nombreComercial }}</div>
              </div>
              <div class="info-card-premium">
                <label>Contacto</label>
                <div class="value">{{ empresa?.email }}</div>
                <div class="sub-value">{{ empresa?.telefono || 'Sin teléfono' }}</div>
              </div>
              <div class="info-card-premium">
                <label>Vendedor</label>
                <div class="value">
                   <i class="bi bi-person-badge-fill me-2 text-corporate"></i>
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
                   <div class="card border-0 bg-light p-4 rounded-4">
                      <h4 class="section-title-mini">Estado del Plan</h4>
                      <div class="d-flex justify-content-between align-items-center mb-3">
                         <span class="text-muted">Plan Actual</span>
                         <span class="fw-800 text-corporate">{{ empresa?.plan || 'N/A' }}</span>
                      </div>
                      <div class="d-flex justify-content-between align-items-center mb-3">
                         <span class="text-muted">Vencimiento</span>
                         <span class="fw-800" [class.text-danger]="isExpired(empresa?.fechaVencimiento)">
                            {{ empresa?.fechaVencimiento | date:'dd/MM/yyyy' }}
                         </span>
                      </div>
                      <div class="d-flex justify-content-between align-items-center">
                         <span class="text-muted">Último Pago</span>
                         <span class="fw-800 text-success">
                            {{ empresa?.ultimoPago?.monto | currency:'USD' }} ({{ empresa?.ultimoPago?.fecha | date:'dd/MM' }})
                         </span>
                      </div>
                   </div>
                </div>
                <div class="col-md-6">
                   <div class="card border-0 bg-light p-4 rounded-4">
                      <h4 class="section-title-mini">Uso Actual</h4>
                      <div class="mb-3">
                         <div class="d-flex justify-content-between mb-1">
                            <span class="text-muted small fw-bold">Usuarios</span>
                            <span class="small fw-800">{{ empresa?.usage?.usuarios || 0 }}/{{ empresa?.limits?.max_usuarios || '-' }}</span>
                         </div>
                         <div class="progress-premium">
                            <div class="progress-bar-premium" [style.width]="getUsagePercent(empresa?.usage?.usuarios, empresa?.limits?.max_usuarios) + '%'"></div>
                         </div>
                      </div>
                      <div class="mb-3">
                         <div class="d-flex justify-content-between mb-1">
                            <span class="text-muted small fw-bold">Establecimientos</span>
                            <span class="small fw-800">{{ empresa?.usage?.establecimientos || 0 }}/{{ empresa?.limits?.max_establecimientos || '-' }}</span>
                         </div>
                         <div class="progress-premium">
                            <div class="progress-bar-premium" [style.width]="getUsagePercent(empresa?.usage?.establecimientos, empresa?.limits?.max_establecimientos) + '%'"></div>
                         </div>
                      </div>
                       <div class="mb-0">
                         <div class="d-flex justify-content-between mb-1">
                            <span class="text-muted small fw-bold">Facturas Mensuales</span>
                            <span class="small fw-800">{{ empresa?.usage?.facturas || 0 }}/{{ empresa?.limits?.max_facturas || '-' }}</span>
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
                      <i class="bi bi-shield-check"></i>
                   </div>
                   <div>
                      <h4 class="m-0 fw-800 text-corporate">Firma Electrónica</h4>
                      <p class="text-muted small">Estado de la facturación ante el SRI</p>
                   </div>
                </div>

                <div class="row g-3">
                   <div class="col-md-6">
                      <div class="info-pill">
                         <label>Estado del Certificado</label>
                         <div class="d-flex align-items-center gap-2">
                            <div class="status-indicator" [class.success]="empresa?.sri?.certificado_valido"></div>
                            <span class="fw-bold">{{ empresa?.sri?.certificado_valido ? 'Válido' : 'Expirado' }}</span>
                         </div>
                      </div>
                   </div>
                   <div class="col-md-6">
                      <div class="info-pill">
                         <label>Expira el</label>
                         <div class="fw-bold text-dark">{{ (empresa?.sri?.fecha_expiracion | date:'dd MMM, yyyy') || 'Desconocido' }}</div>
                      </div>
                   </div>
                   <div class="col-md-6">
                      <div class="info-pill">
                         <label>Ambiente SRI</label>
                         <div class="badge-ambient" [class.prod]="empresa?.sri?.ambiente === 'PRODUCCION'">
                            {{ empresa?.sri?.ambiente || 'PRUEBAS' }}
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
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10005;
      padding: 1rem;
    }
    .modal-container-premium {
      background: #ffffff; width: 850px; height: 650px;
      max-width: 95vw; max-height: 90vh; border-radius: 32px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-premium { padding: 2rem 2.5rem; display: flex; justify-content: space-between; align-items: center; }
    .modal-title-premium { font-size: 1.4rem; font-weight: 900; color: #161d35; margin: 0; }
    .btn-close-premium { background: #f8fafc; border: none; width: 40px; height: 40px; border-radius: 12px; color: #94a3b8; cursor: pointer; }
    
    .avatar-details-premium {
      width: 54px; height: 54px; color: white;
      border-radius: 16px; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.25rem;
    }

    .badge-status-details {
      font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.75rem; border-radius: 100px;
      text-transform: uppercase;
    }
    .badge-status-details.active { background: #dcfce7; color: #15803d; } 
    .badge-status-details.inactive { background: #fee2e2; color: #b91c1c; }
    .badge-plan-details { background: #161d35; color: white; font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.75rem; border-radius: 100px; text-transform: uppercase; }

    .modal-nav-tabs {
       display: flex; padding: 0 2.5rem; gap: 0.5rem; border-bottom: 1px solid #f1f5f9;
    }
    .nav-tab-btn {
       background: transparent; border: none; padding: 1rem 1.5rem; font-size: 0.85rem;
       font-weight: 700; color: #94a3b8; display: flex; align-items: center; gap: 0.5rem;
       position: relative; transition: all 0.2s;
    }
    .nav-tab-btn i { font-size: 1.1rem; }
    .nav-tab-btn.active { color: #161d35; }
    .nav-tab-btn.active::after {
       content: ""; position: absolute; bottom: 0; left: 0; width: 100%;
       height: 3px; background: #161d35; border-radius: 3px 3px 0 0;
    }

    .modal-body-premium { padding: 2rem 2.5rem; overflow-y: auto; flex: 1; }
    
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    .info-card-premium { background: #f8fafc; padding: 1.25rem; border-radius: 18px; border: 1px solid #f1f5f9; }
    .info-card-premium label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 0.5rem; }
    .info-card-premium .value { font-size: 1rem; font-weight: 800; color: #1e293b; }
    .info-card-premium .sub-value { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
    .col-span-2 { grid-column: span 2; }

    .section-title-mini { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 1.25rem; }
    .progress-premium { height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
    .progress-bar-premium { height: 100%; background: #161d35; border-radius: 10px; }

    .system-card-premium { background: #f8fafc; border-radius: 24px; padding: 2rem; border: 1px solid #f1f5f9; }
    .icon-sq { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .bg-corporate { background: #161d35; }
    .info-pill { background: white; padding: 1rem; border-radius: 14px; border: 1px solid #f1f5f9; }
    .info-pill label { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.35rem; }
    
    .status-indicator { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; }
    .status-indicator.success { background: #22c55e; }
    .badge-ambient { font-size: 0.75rem; font-weight: 800; color: #f59e0b; }
    .badge-ambient.prod { color: #8b5cf6; }

    .modal-footer-premium { padding: 1.5rem 2.5rem; background: #ffffff; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #f1f5f9; }
    .btn-submit-premium { background: #161d35; color: #ffffff; border: none; padding: 0.85rem 2.5rem; border-radius: 14px; font-weight: 700; transition: all 0.2s; }
    .btn-cancel-premium { background: #ffffff; color: #64748b; border: 1px solid #e2e8f0; padding: 0.85rem 2rem; border-radius: 14px; font-weight: 700; }
    
    .text-corporate { color: #161d35 !important; }
    .font-mono { font-family: 'DM Mono', monospace; }
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
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
