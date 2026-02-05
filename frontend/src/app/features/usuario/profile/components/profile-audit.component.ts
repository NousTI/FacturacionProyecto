import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilUsuario } from '../../../../domain/models/perfil.model';

@Component({
    selector: 'app-profile-audit',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="audit-strip p-4">
      <div class="row align-items-center justify-content-between g-4">
        <div class="col-md-3">
          <div class="audit-item">
            <span class="l">Último Acceso al Sistema</span>
            <span class="v text-primary">{{ (perfil.ultimo_acceso | date:'medium') || 'Sesión inicial' }}</span>
          </div>
        </div>
        <div class="col-md-3">
          <div class="audit-item">
            <span class="l">Fecha de Alta</span>
            <span class="v">{{ perfil.created_at | date:'longDate' }}</span>
          </div>
        </div>
        <div class="col-md-3">
          <div class="audit-item">
            <span class="l">Estado de Cuenta</span>
            <div class="d-flex align-items-center mt-1">
                <span class="dot" [class.active]="perfil.system_estado === 'ACTIVA'"></span>
                <span class="v ms-2">{{ perfil.system_estado }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .audit-strip {
      background: #fcfdfe;
      border-radius: 20px;
      border: 1px dashed #cbd5e1;
    }
    .audit-item { display: flex; flex-direction: column; }
    .audit-item .l { font-size: 0.7rem; font-weight: 850; color: #94a3b8; text-transform: uppercase; }
    .audit-item .v { font-size: 0.95rem; font-weight: 800; color: #161d35; margin-top: 2px; }

    .dot { width: 10px; height: 10px; border-radius: 50%; background: #94a3b8; }
    .dot.active { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
  `]
})
export class ProfileAuditComponent {
    @Input() perfil!: PerfilUsuario;
}
