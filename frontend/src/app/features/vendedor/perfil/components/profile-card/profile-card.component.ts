
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-premium h-100">
      <div class="card-body p-4">
        <div class="text-center mb-4">
          <div class="avatar-circle mx-auto mb-3 animate__animated animate__zoomIn">
            {{ getInitials(nombres, apellidos) }}
          </div>
          <h3 class="fw-bold mb-1 header-font">{{ nombres }} {{ apellidos }}</h3>
          <p class="text-muted mb-2">{{ email }}</p>
          <span class="badge" [ngClass]="activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
            {{ activo ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <hr class="border-light opacity-50 my-4">

        <div class="row g-3">
          <div class="col-6">
            <div class="profile-info-item">
              <label class="info-label">Documento</label>
              <p class="info-value">{{ documento_identidad || 'N/A' }}</p>
            </div>
          </div>
          <div class="col-6">
            <div class="profile-info-item">
              <label class="info-label">Teléfono</label>
              <p class="info-value">{{ telefono || 'N/A' }}</p>
            </div>
          </div>
          <div class="col-6">
            <div class="profile-info-item">
              <label class="info-label">Tipo Comisión</label>
              <p class="info-value">{{ tipo_comision || 'N/A' }}</p>
            </div>
          </div>
          <div class="col-6">
             <div class="profile-info-item">
              <label class="info-label">Fecha Registro</label>
              <p class="info-value">{{ fecha_registro | date:'mediumDate' }}</p>
            </div>
          </div>
        </div>

        <div class="mt-4 p-3 rounded-3 bg-light-subtle row g-2">
            <div class="col-6 text-center border-end">
                <small class="d-block text-muted fw-semibold">Empresas</small>
                <span class="fs-4 fw-bold text-dark">{{ empresas_asignadas }}</span>
            </div>
            <div class="col-6 text-center">
                <small class="d-block text-muted fw-semibold">Generado</small>
                <span class="fs-4 fw-bold text-success">{{ ingresos_generados | currency }}</span>
            </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .card-premium {
      background: white;
      border: 1px solid #eef2f6;
      border-radius: 20px;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .card-premium:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
    }
    .avatar-circle {
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
      box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
    }
    .header-font {
        font-family: 'Plus Jakarta Sans', sans-serif;
        color: #1e293b;
    }
    .info-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .info-value {
      font-size: 0.95rem;
      color: #334155;
      font-weight: 600;
      margin-bottom: 0;
    }
    .badge {
        font-size: 0.75rem;
        padding: 0.5em 1em;
        border-radius: 50px;
        font-weight: 600;
    }
  `]
})
export class ProfileCardComponent {
  @Input() nombres: string = '';
  @Input() apellidos: string = '';
  @Input() email: string = '';
  @Input() activo: boolean = false;
  @Input() documento_identidad: string = '';
  @Input() telefono: string = '';
  @Input() tipo_comision: string = '';
  @Input() fecha_registro: string = '';
  @Input() empresas_asignadas: number = 0;
  @Input() ingresos_generados: number = 0;

  getInitials(n: string, a: string): string {
    const first = n?.charAt(0) || '';
    const second = a?.charAt(0) || '';
    const initials = first + second;
    return initials ? initials.toUpperCase() : 'VP';
  }
}
