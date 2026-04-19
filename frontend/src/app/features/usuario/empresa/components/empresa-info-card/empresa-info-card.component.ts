import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Empresa } from '../../../../../domain/models/empresa.model';
import { PermissionsService } from '../../../../../core/auth/permissions.service';
import { GET_PERSONA_LABEL, GET_CONTRIBUYENTE_LABEL } from '../../../../../core/constants/sri-iva.constants';
import { CONFIGURACION_PERMISSIONS } from '../../../../../constants/permission-codes';

@Component({
  selector: 'app-empresa-info-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-premium shadow-premium-sm animate-fade-in">
      <div class="card-header-lux">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-4">
            <div class="logo-wrapper shadow-sm">
              <img *ngIf="empresa.logo_url" [src]="empresa.logo_url" alt="Logo" class="logo-img" />
              <i *ngIf="!empresa.logo_url" class="bi bi-building-fill text-muted fs-3"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge-ruc">{{ empresa.ruc }}</span>
                <span class="badge-type" *ngIf="empresa.obligado_contabilidad">Contabilidad</span>
              </div>
              <h3 class="razon-social m-0">{{ empresa.razon_social }}</h3>
              <p class="nombre-comercial text-muted m-0">{{ empresa.nombre_comercial || 'Información Legal' }}</p>
            </div>
          </div>
          <button *ngIf="canEdit" class="btn-edit-lux" (click)="onEdit.emit()" title="Editar información">
            <i class="bi bi-pencil-square"></i>
          </button>
        </div>
      </div>

      <div class="card-body-lux">
        <div class="info-grid">
          <div class="info-item">
            <div class="icon-box-soft">
              <i class="bi bi-envelope"></i>
            </div>
            <div class="info-content">
              <label>Correo Electrónico</label>
              <span class="value">{{ empresa.email }}</span>
            </div>
          </div>

          <div class="info-item">
            <div class="icon-box-soft">
              <i class="bi bi-telephone"></i>
            </div>
            <div class="info-content">
              <label>Teléfono Contacto</label>
              <span class="value">{{ empresa.telefono || 'No registrado' }}</span>
            </div>
          </div>

          <div class="info-item">
            <div class="icon-box-soft">
              <i class="bi bi-geo-alt"></i>
            </div>
            <div class="info-content">
              <label>Dirección Matriz</label>
              <span class="value">{{ empresa.direccion || 'Sin dirección registrada' }}</span>
            </div>
          </div>

          <div class="info-item">
            <div class="icon-box-soft">
              <i class="bi bi-person-badge"></i>
            </div>
            <div class="info-content">
              <label>Tipo Persona | Régimen</label>
              <span class="value">{{ getPersonaLabel(empresa.tipo_persona) + ' | ' + getContribuyenteLabel(empresa.tipo_contribuyente) }}</span>
            </div>
          </div>

          <div class="info-item" *ngIf="empresa.vendedor_name">
            <div class="icon-box-soft">
              <i class="bi bi-person-check"></i>
            </div>
            <div class="info-content">
              <label>Asesor Asignado</label>
              <span class="value">{{ empresa.vendedor_name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-premium {
      background: white;
      border-radius: 28px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    }

    .card-header-lux {
      padding: 2.25rem;
      background: #ffffff;
      border-bottom: 1px solid #f8fafc;
    }

    .logo-wrapper {
      width: 72px;
      height: 72px;
      background: #f8fafc;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border: 1px solid #f1f5f9;
    }

    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 14px;
    }

    .badge-ruc {
      background: var(--neutral-700, var(--primary-color));
      color: white;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 10px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }

    .badge-type {
      background: var(--status-info-bg);
      color: var(--status-info-text);
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 10px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .razon-social {
      font-size: 1.6rem;
      font-weight: 900;
      color: var(--primary-color);
      letter-spacing: -0.5px;
    }

    .nombre-comercial {
      font-size: 0.9rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .btn-edit-lux {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1.5px solid #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 1.2rem;
    }

    .btn-edit-lux:hover {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
      transform: translateY(-2px);
    }

    .card-body-lux {
      padding: 2rem 2.25rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
    }

    .icon-box-soft {
      width: 44px;
      height: 44px;
      background: var(--status-neutral-bg);
      color: var(--status-neutral-text);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .info-content label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .info-content .value {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--primary-color);
      word-break: break-all;
    }

    @media (max-width: 768px) {
      .info-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      .razon-social { font-size: 1.3rem; }
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

  private permissionsService = inject(PermissionsService);

  get canEdit(): boolean {
    return this.permissionsService.hasPermission(CONFIGURACION_PERMISSIONS.EMPRESA);
  }

  getPersonaLabel(code: string): string {
    return GET_PERSONA_LABEL(code);
  }

  getContribuyenteLabel(code: string): string {
    return GET_CONTRIBUYENTE_LABEL(code);
  }
}

