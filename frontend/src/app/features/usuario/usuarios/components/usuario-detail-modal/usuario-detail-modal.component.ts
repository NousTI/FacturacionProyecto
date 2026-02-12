import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../../domain/models/user.model';

@Component({
  selector: 'app-usuario-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-lux" (click)="$event.stopPropagation()">
        
        <!-- Header con gradiente -->
        <div class="modal-header-lux">
          <div class="user-profile-header">
            <div class="user-avatar-large shadow-sm">
              <i class="bi bi-person-fill"></i>
            </div>
            <div class="user-info-text">
              <h2 class="user-name">{{ usuario.nombre || usuario.nombres }} {{ usuario.apellido || usuario.apellidos }}</h2>
              <span class="badge-role" [ngClass]="usuario.rol_codigo || usuario.role || 'USUARIO'">
                {{ usuario.rol_nombre || usuario.role || 'USUARIO' }}
              </span>
            </div>
          </div>
          <button (click)="close()" class="btn-close-lux">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-lux scroll-custom">
          <div class="row g-4">
            <!-- Columna Izquierda: Información Principal -->
            <div class="col-md-7">
              <div class="detail-section mb-4">
                <h3 class="section-title"><i class="bi bi-info-circle me-2"></i>Información de Acceso</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Correo Electrónico</span>
                    <span class="value">{{ usuario.correo || usuario.email }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Teléfono / Celular</span>
                    <span class="value">{{ usuario.telefono || 'No registrado' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Estado de Cuenta</span>
                    <span class="value" [class.text-success]="usuario.activo !== false" [class.text-danger]="usuario.activo === false">
                      <i class="bi bi-circle-fill fs-xs me-1"></i>
                      {{ usuario.activo !== false ? 'Cuenta Activa' : 'Cuenta Suspendida' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3 class="section-title"><i class="bi bi-calendar-event me-2"></i>Actividad Local</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Último Acceso</span>
                    <span class="value">{{ (usuario.ultimo_acceso | date:'dd MMM yyyy, HH:mm') || 'Nunca' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">ID de Usuario</span>
                    <span class="value">{{ usuario.id }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Estadísticas rápidas o info adicional -->
            <div class="col-md-5">
              <div class="summary-card shadow-sm p-4 rounded-4 mb-4">
                <h4 class="card-title-sm mb-3">Empresa Vinculada</h4>
                <div class="d-flex align-items-center gap-3">
                  <div class="company-icon">
                    <i class="bi bi-building"></i>
                  </div>
                  <div>
                    <p class="m-0 fw-bold">Empresa Activa</p>
                    <p class="m-0 text-muted small">ID Empresa: {{ usuario.empresa_id || 'N/A' }}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer-lux">
          <button (click)="close()" class="btn-primary-lux px-4">Cerrar Detalle</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;
    }
    .modal-container-lux {
      background: #ffffff; width: 850px;
      max-width: 95vw; max-height: 90vh; border-radius: 32px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 50px 100px -20px rgba(15, 23, 53, 0.3);
    }
    .modal-header-lux {
      background: linear-gradient(to right, #f8fafc, #ffffff);
      padding: 2.5rem; display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 1px solid #f1f5f9;
    }
    .user-profile-header { display: flex; align-items: center; gap: 1.5rem; }
    .user-avatar-large {
      width: 80px; height: 80px; background: #161d35; color: white;
      border-radius: 24px; display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem;
    }
    .user-name { font-size: 1.75rem; font-weight: 800; color: #161d35; margin: 0; letter-spacing: -0.5px; }
    .badge-role {
      display: inline-block; padding: 4px 12px; border-radius: 8px; font-weight: 700; font-size: 0.75rem;
      text-transform: uppercase; margin-top: 8px;
    }
    .badge-role.ADMIN { background: #fee2e2; color: #ef4444; }
    .badge-role.VENDEDOR { background: #dcfce7; color: #22c55e; }
    .badge-role.USUARIO { background: #e0f2fe; color: #0ea5e9; }
    .badge-role.SUPERADMIN { background: #161d35; color: #ffffff; }

    .btn-close-lux { background: white; border: 1.5px solid #f1f5f9; width: 44px; height: 44px; border-radius: 12px; color: #64748b; font-size: 1.25rem; }
    
    .modal-body-lux { padding: 2.5rem; overflow-y: auto; flex: 1; }
    .section-title { font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem; }
    .info-grid { display: grid; gap: 1.25rem; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-item .label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .info-item .value { font-size: 1rem; font-weight: 600; color: #334155; }
    
    .summary-card { background: #f8fafc; border: 1px solid #f1f5f9; }
    .card-title-sm { font-size: 0.85rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
    .company-icon { width: 40px; height: 40px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: #161d35; }
    
    .permissions-preview-lux { background: #161d35; color: white; }
    .permissions-preview-lux .card-title-sm { color: #94a3b8; }
    .perm-mini-tag { display: inline-block; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; margin: 0 6px 6px 0; border: 1px solid rgba(255,255,255,0.1); }
    .perm-more { font-size: 0.75rem; color: #94a3b8; font-weight: 600; margin-top: 4px; }

    .modal-footer-lux { padding: 1.5rem 2.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; }
    .btn-primary-lux { background: #161d35; color: white; border: none; height: 48px; border-radius: 14px; font-weight: 700; }
    
    .fs-xs { font-size: 0.6rem; }
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class UsuarioDetailModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) usuario!: User;
  @Output() onClose = new EventEmitter<void>();

  ngOnInit() { document.body.style.overflow = 'hidden'; }
  ngOnDestroy() { document.body.style.overflow = 'auto'; }

  close() { this.onClose.emit(); }
}
