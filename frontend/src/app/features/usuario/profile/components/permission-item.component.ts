import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Permiso } from '../../../../domain/models/perfil.model';

@Component({
  selector: 'app-permission-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="editorial-permiso-item" [class.denied]="!permiso.concedido">
      <div class="permiso-meta">
        <span class="editorial-badge flat small mono">{{ permiso.codigo }}</span>
        
        <span class="status-indicator-editorial" [class.granted]="permiso.concedido">
          <i class="bi" [ngClass]="permiso.concedido ? 'bi-check2' : 'bi-lock-fill'"></i>
          {{ permiso.concedido ? 'CONCEDIDO' : 'ACCESO RESTRINGIDO' }}
        </span>
      </div>

      <div class="permiso-info-content mt-2">
        <h5 class="permiso-label-title">{{ permiso.nombre }}</h5>
        <p class="permiso-label-desc">{{ permiso.descripcion || 'Sin descripción detallada disponible.' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .editorial-permiso-item {
      padding: 1.25rem;
      border-radius: 18px;
      border: 1px solid #f1f5f9;
      background: white;
      transition: all 0.25s ease;
      &.denied { background: #fafbfc; border-style: dashed; opacity: 0.8; }
      &:hover { transform: translateX(5px); border-color: #cbd5e1; }
    }

    .permiso-meta { display: flex; justify-content: space-between; align-items: center; }
    
    .editorial-badge.mono { font-family: 'Consolas', monospace; background: #f8fafc; color: #94a3b8; font-weight: 800; }
    
    .status-indicator-editorial {
      font-size: 0.65rem; font-weight: 900; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 8px; background: #f1f5f9; color: #94a3b8;
      &.granted { background: #1e293b; color: white; box-shadow: 0 4px 10px -2px rgba(0,0,0,0.2); }
    }

    .permiso-label-title { font-size: 1rem; font-weight: 850; color: #1e293b; margin: 0; }
    .permiso-label-desc { font-size: 0.8rem; color: #64748b; margin: 0.25rem 0 0; font-weight: 600; line-height: 1.5; }
  `]
})
export class PermissionItemComponent {
  @Input({ required: true }) permiso!: Permiso;
}
