import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Empresa } from '../../../../../domain/models/empresa.model';

@Component({
  selector: 'app-empresa-info-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-premium shadow-premium-sm animate-fade-in">
      <div class="card-header-lux">
        <div class="d-flex justify-content-between align-items-start">
          <div class="d-flex align-items-center gap-3">
            <div class="logo-wrapper shadow-sm">
              <img *ngIf="empresa.logo_url" [src]="empresa.logo_url" alt="Logo" class="logo-img" />
              <i *ngIf="!empresa.logo_url" class="bi bi-building-fill text-muted fs-3"></i>
            </div>
            <div>
              <h3 class="razon-social m-0">{{ empresa.razon_social }}</h3>
              <p class="nombre-comercial text-muted m-0">{{ empresa.nombre_comercial || 'Empresa Registrada' }}</p>
            </div>
          </div>
          <button class="btn-edit-lux" (click)="onEdit.emit()" title="Editar información">
            <i class="bi bi-pencil-square"></i>
          </button>
        </div>
      </div>

      <div class="card-body-lux">
        <div class="info-grid">
          <div class="info-item">
            <label>Identificación (RUC)</label>
            <div class="value-wrapper">
              <i class="bi bi-card-text me-2 text-primary"></i>
              <span>{{ empresa.ruc }}</span>
            </div>
          </div>

          <div class="info-item">
            <label>Correo Electrónico</label>
            <div class="value-wrapper">
              <i class="bi bi-envelope me-2 text-primary"></i>
              <span>{{ empresa.email }}</span>
            </div>
          </div>

          <div class="info-item">
            <label>Teléfono de Contacto</label>
            <div class="value-wrapper">
              <i class="bi bi-telephone me-2 text-primary"></i>
              <span>{{ empresa.telefono || 'No registrado' }}</span>
            </div>
          </div>

          <div class="info-item">
            <label>Tipo de Contribuyente</label>
            <div class="value-wrapper">
              <i class="bi bi-person-badge me-2 text-primary"></i>
              <span>{{ empresa.tipo_contribuyente || 'No especificado' }}</span>
            </div>
          </div>

          <div class="info-item">
            <label>Asesor Comercial (Vendedor)</label>
            <div class="value-wrapper">
              <i class="bi bi-person-check me-2 text-primary"></i>
              <span>{{ empresa.vendedor_name || 'Sin asesor asignado' }}</span>
            </div>
          </div>

          <div class="info-item full-width">
            <label>Dirección Matriz</label>
            <div class="value-wrapper">
              <i class="bi bi-geo-alt me-2 text-primary"></i>
              <span>{{ empresa.direccion || 'Sin dirección registrada' }}</span>
            </div>
          </div>

          <div class="info-item">
            <label>Contabilidad</label>
            <div class="value-wrapper">
              <i class="bi bi-journal-check me-2 text-primary"></i>
              <span class="badge" [ngClass]="empresa.obligado_contabilidad ? 'bg-info-subtle text-info' : 'bg-secondary-subtle text-secondary'">
                {{ empresa.obligado_contabilidad ? 'Obligado a llevar' : 'No obligado' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-premium {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
      transition: all 0.3s ease;
    }

    .card-header-lux {
      padding: 2rem;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-bottom: 1px solid #f1f5f9;
    }

    .logo-wrapper {
      width: 64px;
      height: 64px;
      background: white;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border: 1px solid #e2e8f0;
    }

    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
    }

    .razon-social {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.5px;
    }

    .nombre-comercial {
      font-size: 0.95rem;
      font-weight: 500;
    }

    .btn-edit-lux {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: #f1f5f9;
      border: none;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 1.25rem;
    }

    .btn-edit-lux:hover {
      background: #161d35;
      color: white;
      transform: translateY(-2px);
    }

    .card-body-lux {
      padding: 2rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .info-item label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .value-wrapper {
      display: flex;
      align-items: center;
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
    }

    .full-width {
      grid-column: span 2;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      font-weight: 700;
    }

    @media (max-width: 768px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
      .full-width {
        grid-column: span 1;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
  `]
})
export class EmpresaInfoCardComponent {
  @Input() empresa!: Empresa;
  @Output() onEdit = new EventEmitter<void>();
}
