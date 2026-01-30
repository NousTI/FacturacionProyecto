import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteUsuario } from '../services/clientes.service';

@Component({
  selector: 'app-clientes-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close.emit()">
      <div class="modal-container-premium" (click)="$event.stopPropagation()">
        
        <div class="modal-header-premium">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-large">
              {{ usuario.nombre.charAt(0) }}
            </div>
            <div>
              <h2 class="modal-title">{{ usuario.nombre }}</h2>
              <span class="badge-role">{{ usuario.role }}</span>
            </div>
          </div>
          <button (click)="close.emit()" class="btn-close-circle">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-premium scroll-custom">
          
          <!-- Seccion Trazabilidad (Dinamica) -->
          <div class="section-card mb-4">
            <h3 class="section-title"><i class="bi bi-diagram-3 me-2"></i>Trazabilidad de Creación</h3>
            
            <div class="timeline-lineage">
              <!-- Empresa -->
              <div class="timeline-item">
                <div class="timeline-icon bg-primary">
                  <i class="bi bi-building"></i>
                </div>
                <div class="timeline-content">
                  <span class="timeline-label">EMPRESA ORIGEN</span>
                  <span class="timeline-value">{{ usuario.empresa_nombre }}</span>
                </div>
              </div>

              <!-- Creador (Vendedor o Admin) -->
              <div class="timeline-item" *ngIf="usuario.creado_por_nombre">
                <div class="timeline-icon" [ngClass]="usuario.vendedor_id ? 'bg-orange' : 'bg-gray'">
                  <i class="bi" [ngClass]="usuario.vendedor_id ? 'bi-shop' : 'bi-person-badge'"></i>
                </div>
                <div class="timeline-content">
                  <span class="timeline-label">CREADO POR ({{ usuario.creado_por_role }})</span>
                  <span class="timeline-value">{{ usuario.creado_por_nombre }}</span>
                  <p class="timeline-hint">Acción realizada el {{ usuario.fecha_registro | date:'mediumDate' }}</p>
                </div>
              </div>

              <!-- Usuario Actual -->
              <div class="timeline-item active">
                <div class="timeline-icon bg-success">
                  <i class="bi bi-person-check"></i>
                </div>
                <div class="timeline-content">
                  <span class="timeline-label">USUARIO FINAL</span>
                  <span class="timeline-value text-success">{{ usuario.nombre }}</span>
                  <p class="timeline-hint">Estado: {{ usuario.estado }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Información General -->
          <div class="section-card">
            <h3 class="section-title"><i class="bi bi-info-circle me-2"></i>Datos del Usuario</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Email</label>
                <span>{{ usuario.email }}</span>
              </div>
              <div class="info-item">
                <label>Fecha Registro</label>
                <span>{{ usuario.fecha_registro | date:'longDate' }}</span>
              </div>
              <div class="info-item">
                <label>ID Sistema</label>
                <span class="text-monospace">{{ usuario.id }}</span>
              </div>
            </div>
          </div>

        </div>

        <div class="modal-footer-premium">
          <button (click)="close.emit()" class="btn-secondary-premium">Cerrar</button>
          <button class="btn-primary-premium">Gestionar Acceso</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
    }
    .modal-container-premium {
      background: #ffffff; width: 550px; max-width: 95vw;
      border-radius: 28px; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-premium {
      padding: 2rem; background: #f8fafc; border-bottom: 1px solid #f1f5f9;
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .avatar-large {
      width: 64px; height: 64px; background: #4f46e5; color: white;
      border-radius: 18px; display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 800;
    }
    .modal-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0; }
    .badge-role {
      background: #eef2ff; color: #4f46e5; font-size: 0.7rem; font-weight: 800;
      padding: 0.2rem 0.6rem; border-radius: 6px; text-transform: uppercase;
    }
    .btn-close-circle {
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: #ffffff; color: #94a3b8; display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; box-shadow: 0 4px 10px rgba(0,0,0,0.05); cursor: pointer;
    }
    
    .modal-body-premium { padding: 2rem; max-height: 60vh; overflow-y: auto; }
    .section-title { font-size: 0.9rem; font-weight: 800; color: #475569; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .timeline-lineage { display: flex; flex-direction: column; gap: 0; }
    .timeline-item { display: flex; gap: 1.5rem; padding-bottom: 2rem; position: relative; }
    .timeline-item:not(:last-child)::after {
      content: ''; position: absolute; left: 20px; top: 40px; bottom: 0; width: 2px;
      background: #e2e8f0; border-radius: 1px;
    }
    
    .timeline-icon {
      width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.25rem; z-index: 2; flex-shrink: 0;
    }
    .bg-primary { background: #4f46e5; }
    .bg-orange { background: #f97316; }
    .bg-gray { background: #64748b; }
    .bg-success { background: #16a34a; }
    
    .timeline-content { display: flex; flex-direction: column; gap: 2px; }
    .timeline-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px; }
    .timeline-value { font-size: 1rem; font-weight: 700; color: #1e293b; }
    .timeline-hint { font-size: 0.75rem; color: #64748b; margin: 0; margin-top: 4px; }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .info-item { display: flex; flex-direction: column; }
    .info-item label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
    .info-item span { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
    .text-monospace { font-family: monospace; color: #64748b; font-size: 0.8rem !important; }

    .modal-footer-premium {
      padding: 1.5rem 2rem; background: #f8fafc; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end; gap: 1rem;
    }
    .btn-secondary-premium {
      background: white; border: 1px solid #e2e8f0; color: #64748b;
      padding: 0.6rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer;
    }
    .btn-primary-premium {
      background: #161d35; border: none; color: white;
      padding: 0.6rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer;
    }
  `]
})
export class ClientesDetailsModalComponent {
  @Input() usuario!: ClienteUsuario;
  @Output() close = new EventEmitter<void>();
}
