import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permiso } from '../../../../domain/models/perfil.model';

@Component({
    selector: 'app-permission-item',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="permiso-detail-item" [class.not-granted]="!permiso.concedido">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div class="permiso-id-section">
          <span class="permiso-code">{{ permiso.codigo }}</span>
          <span class="permiso-type-badge" [class]="permiso.tipo.toLowerCase()">{{ permiso.tipo }}</span>
        </div>
        
        <!-- GRANT STATUS BADGE -->
        <span class="grant-status-badge" [class.granted]="permiso.concedido">
          <i class="bi" [ngClass]="permiso.concedido ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
          {{ permiso.concedido ? 'CONCEDIDO' : 'SIN ACCESO' }}
        </span>
      </div>

      <div class="permiso-info-section">
        <h5 class="permiso-title">{{ permiso.nombre }}</h5>
        <p class="permiso-desc">{{ permiso.descripcion || 'Sin descripción detallada disponible.' }}</p>
      </div>
    </div>
  `,
    styles: [`
    .permiso-detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1.25rem;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      background: white;
      transition: all 0.2s ease;
    }
    .permiso-detail-item.not-granted {
      background: #fcfcfc;
      opacity: 0.8;
      border-style: dashed;
    }
    .permiso-detail-item:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }

    .permiso-id-section { display: flex; align-items: center; gap: 10px; }
    .permiso-code {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.65rem;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
      color: #64748b;
      font-weight: 700;
    }
    .permiso-type-badge {
      font-size: 0.6rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 100px;
      letter-spacing: 0.5px;
    }
    .permiso-type-badge.lectura { background: #dcfce7; color: #166534; }
    .permiso-type-badge.escritura { background: #fef9c3; color: #854d0e; }
    .permiso-type-badge.admin { background: #fee2e2; color: #991b1b; }
    .permiso-type-badge.sistema { background: #e0e7ff; color: #3730a3; }
    .permiso-type-badge.especial { background: #fae8ff; color: #86198f; }

    .grant-status-badge {
      font-size: 0.65rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #94a3b8;
    }
    .grant-status-badge.granted {
      background: #161d35;
      color: #ffffff;
      box-shadow: 0 4px 10px rgba(22, 29, 53, 0.2);
    }

    .permiso-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .permiso-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
      font-weight: 500;
    }
  `]
})
export class PermissionItemComponent {
    @Input() permiso!: Permiso;
}
