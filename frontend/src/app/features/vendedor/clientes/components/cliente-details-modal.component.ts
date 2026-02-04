import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cliente-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-content-premium" (click)="$event.stopPropagation()">
        <!-- HEADER -->
        <div class="modal-header-premium">
          <div class="d-flex align-items-center">
            <div class="avatar-large me-3" 
                 [style.background]="getAvatarColor(cliente?.nombres + ' ' + cliente?.apellidos, 0.1)" 
                 [style.color]="getAvatarColor(cliente?.nombres + ' ' + cliente?.apellidos, 1)">
              {{ getInitials(cliente?.nombres + ' ' + cliente?.apellidos) }}
            </div>
            <div>
              <h5 class="mb-1 fw-bold">{{ cliente?.nombres }} {{ cliente?.apellidos }}</h5>
              <p class="text-muted mb-0 small">{{ cliente?.email }}</p>
            </div>
          </div>
          <button class="btn-close-premium" (click)="onClose.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- BODY -->
        <div class="modal-body-premium">
          <!-- Status Badge -->
          <div class="mb-4">
            <span class="badge-status-large" [ngClass]="cliente?.activo ? 'activo' : 'inactivo'">
              <i class="bi" [ngClass]="cliente?.activo ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
              {{ cliente?.activo ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          </div>

          <!-- Info Grid -->
          <div class="info-grid">
            <!-- Empresa -->
            <div class="info-card">
              <div class="info-icon">
                <i class="bi bi-building"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Empresa / Razón Social</span>
                <span class="info-value">{{ cliente?.empresa_nombre || 'N/A' }}</span>
              </div>
            </div>

            <!-- Creado Por (Origen) -->
            <div class="info-card">
              <div class="info-icon">
                <i class="bi bi-person-plus"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Responsable de Registro</span>
                <div class="d-flex flex-column">
                    <div [ngClass]="getOrigenClass(cliente?.origen_creacion)" class="badge-origen-detail mb-1">
                        <i class="bi" [ngClass]="getOrigenIcon(cliente?.origen_creacion)"></i>
                        <span class="ms-1">{{ (cliente?.origen_creacion || 'sistema') | uppercase }}</span>
                    </div>
                    <span class="info-value" *ngIf="cliente?.creado_por_nombre" style="font-size: 0.85rem;">
                        {{ cliente.creado_por_nombre }}
                    </span>
                    <small class="text-muted" *ngIf="cliente?.creado_por_email" style="font-size: 0.7rem;">
                        {{ cliente.creado_por_email }}
                    </small>
                </div>
              </div>
            </div>

            <!-- Rol -->
            <div class="info-card">
              <div class="info-icon">
                <i class="bi bi-shield-check"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Rol</span>
                <span class="info-value">{{ cliente?.rol_nombre || 'Sin Rol' }}</span>
              </div>
            </div>

            <!-- Teléfono -->
            <div class="info-card">
              <div class="info-icon">
                <i class="bi bi-telephone"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Teléfono</span>
                <span class="info-value">{{ cliente?.telefono || 'N/A' }}</span>
              </div>
            </div>

            <!-- Email -->
            <div class="info-card">
              <div class="info-icon">
                <i class="bi bi-envelope"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Correo Electrónico</span>
                <span class="info-value">{{ cliente?.email || 'N/A' }}</span>
              </div>
            </div>

            <!-- Último Acceso -->
            <div class="info-card">
              <div class="info-icon">
                <i class="bi bi-clock-history"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Último Acceso</span>
                <span class="info-value">{{ cliente?.ultimo_acceso ? (cliente.ultimo_acceso | date:'dd/MM/yyyy HH:mm') : 'Nunca' }}</span>
              </div>
            </div>

            <!-- Fecha de Creación -->
            <div class="info-card">
              <div class="info-icon">
                <i class="bi bi-calendar-plus"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Fecha de Creación</span>
                <span class="info-value">{{ cliente?.created_at ? (cliente.created_at | date:'dd/MM/yyyy') : 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer-premium">
          <button class="btn-secondary-premium" (click)="onClose.emit()">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    }

    .modal-content-premium {
      background: white;
      border-radius: 24px;
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header-premium {
      padding: 2rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .avatar-large {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.25rem;
    }

    .btn-close-premium {
      background: #f8fafc;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-close-premium:hover {
      background: #161d35;
      color: white;
    }

    .modal-body-premium {
      padding: 2rem;
      overflow-y: auto;
      flex: 1;
    }

    .badge-status-large {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .badge-status-large.activo {
      background: #dcfce7;
      color: #15803d;
    }
    .badge-status-large.inactivo {
      background: #fee2e2;
      color: #b91c1c;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .info-card {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s;
    }
    .info-card:hover {
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .info-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
      background: rgba(22, 29, 53, 0.05);
      color: #161d35;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .info-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
      word-break: break-word;
    }

    /* Origin Badge in Details */
    .badge-origen-detail {
        display: inline-flex;
        align-items: center;
        padding: 0.35rem 0.75rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 800;
    }
    .badge-origen-detail.superadmin { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-origen-detail.vendedor { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
    .badge-origen-detail.sistema { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .modal-footer-premium {
      padding: 1.5rem 2rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-secondary-premium {
      background: #f8fafc;
      color: #475569;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-secondary-premium:hover {
      background: #e2e8f0;
    }

    @media (max-width: 768px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ClienteDetailsModalComponent {
  @Input() cliente: any;
  @Output() onClose = new EventEmitter<void>();

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getAvatarColor(name: string, opacity: number): string {
    const colors = [
      `rgba(99, 102, 241, ${opacity})`, `rgba(16, 185, 129, ${opacity})`,
      `rgba(245, 158, 11, ${opacity})`, `rgba(239, 68, 68, ${opacity})`,
      `rgba(139, 92, 246, ${opacity})`
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  getOrigenClass(origen?: string): string {
    if (!origen) return 'sistema';
    return origen.toLowerCase();
  }

  getOrigenIcon(origen?: string): string {
    switch (origen?.toLowerCase()) {
      case 'superadmin': return 'bi-shield-check';
      case 'vendedor': return 'bi-person-badge';
      default: return 'bi-cpu';
    }
  }
}
