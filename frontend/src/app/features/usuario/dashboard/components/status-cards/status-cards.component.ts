import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-status-cards',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent],
  providers: [DatePipe],
  template: `
    <div class="d-flex flex-column gap-3">
      <!-- 1. Firma Electrónica -->
      <div class="panel p-3 border-start border-4 shadow-sm" 
           [ngClass]="(firmaInfo?.dias_restantes || 0) < 15 ? 'border-danger' : 'border-warning'">
        <div class="d-flex align-items-center gap-3">
          <div class="ql-icon" 
               [style.color]="(firmaInfo?.dias_restantes || 0) < 15 ? '#ef4444' : '#f59e0b'"
               [style.background]="(firmaInfo?.dias_restantes || 0) < 15 ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)'">
            <i class="bi bi-key-fill"></i>
          </div>
          <div *ngIf="firmaInfo; else noFirma">
            <div class="small text-muted fw-bold" style="font-size: 0.65rem; letter-spacing: 0.05rem;">FIRMA ELECTRÓNICA</div>
            <div class="fw-bold" style="font-size: 0.9rem;">
              {{ (firmaInfo.dias_restantes || 0) > 0 ? 'Expira en ' + firmaInfo.dias_restantes + ' días' : 'Firma Expirada' }}
            </div>
            <div class="text-muted" style="font-size: 0.7rem;">Vencimiento: {{ firmaInfo.fecha | date:'dd/MM/yyyy' }}</div>
          </div>
          <ng-template #noFirma>
            <div>
              <div class="small text-muted fw-bold" style="font-size: 0.65rem;">FIRMA ELECTRÓNICA</div>
              <div class="fw-bold text-danger" style="font-size: 0.9rem;">No configurada</div>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- 2. Estado de Suscripción (Consumo de Plan Ampliado) -->
      <div class="panel p-3 shadow-sm border-start border-4" 
           *ngIf="consumoPlan"
           [class.warning-pulse]="isNearLimit() || isNearExpiration()"
           [ngClass]="getSubscriptionBorderClass()">
        
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div class="d-flex align-items-center gap-2">
            <div class="ql-icon-sub" [ngClass]="getSubscriptionIconClass()">
              <i class="bi bi-box-seam-fill"></i>
            </div>
            <div>
              <div class="small text-muted fw-bold" style="font-size: 0.65rem; letter-spacing: 0.05rem;">SUSCRIPCIÓN: {{ consumoPlan.nombre_plan | uppercase }}</div>
              <div class="fw-bold" style="font-size: 0.9rem;">{{ consumoPlan.estado }}</div>
            </div>
          </div>
          <span class="badge" [ngClass]="getBadgeClass()">{{ getUsagePercent() }}%</span>
        </div>

        <div class="mb-3">
          <div class="d-flex justify-content-between mb-1">
            <span class="small text-muted" style="font-size: 0.7rem;">Uso de documentos</span>
            <span class="small fw-bold" style="font-size: 0.7rem;">{{ consumoPlan.actual }} / {{ consumoPlan.limite }}</span>
          </div>
          <div class="progress mb-1" style="height: 8px; border-radius: 4px; background-color: #f1f5f9;">
            <div class="progress-bar" 
                 [ngClass]="getProgressBarClass()"
                 [class.progress-bar-striped]="isNearLimit()"
                 [class.progress-bar-animated]="isNearLimit()"
                 [style.width.%]="getUsagePercent()"></div>
          </div>
          <div class="d-flex justify-content-between">
            <div class="text-muted" style="font-size: 0.65rem;">
              {{ (consumoPlan.limite || 0) - (consumoPlan.actual || 0) }} restantes este mes
            </div>
          </div>
        </div>

        <div class="pt-2 border-top">
          <div class="row g-0">
            <div class="col-6">
              <div class="text-muted" style="font-size: 0.6rem;">INICIO</div>
              <div class="fw-bold" style="font-size: 0.75rem;">{{ consumoPlan.fecha_inicio | date:'dd/MM/yyyy' }}</div>
            </div>
            <div class="col-6">
              <div class="text-muted" style="font-size: 0.6rem;">VENCE</div>
              <div class="fw-bold" [class.text-danger]="isNearExpiration()" style="font-size: 0.75rem;">
                {{ consumoPlan.fecha_vencimiento | date:'dd/MM/yyyy' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
    }
    .panel:hover {
      transform: translateY(-2px);
    }
    .ql-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .ql-icon-sub {
      width: 32px; height: 32px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem;
      flex-shrink: 0;
    }
    
    .bg-soft-success { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
    .bg-soft-warning { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .bg-soft-danger { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .bg-soft-primary { background-color: rgba(79, 70, 229, 0.1); color: #4f46e5; }

    .warning-pulse {
      animation: pulse-border 2s infinite;
    }

    @keyframes pulse-border {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
      70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    .badge {
      padding: 0.4em 0.8em;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.65rem;
    }
  `]
})
export class StatusCardsComponent {
  @Input() firmaInfo?: { fecha: string; dias_restantes: number };
  @Input() consumoPlan?: { 
    actual: number; 
    limite: number;
    nombre_plan?: string;
    fecha_inicio?: string;
    fecha_vencimiento?: string;
    estado?: string;
  };

  getUsagePercent(): number {
    if (!this.consumoPlan || this.consumoPlan.limite === 0) return 0;
    const percent = Math.round((this.consumoPlan.actual / this.consumoPlan.limite) * 100);
    return Math.min(percent, 100);
  }

  isNearLimit(): boolean {
    return this.getUsagePercent() >= 85;
  }

  isNearExpiration(): boolean {
    if (!this.consumoPlan?.fecha_vencimiento) return false;
    const venc = new Date(this.consumoPlan.fecha_vencimiento);
    const andHoy = new Date();
    const diff = venc.getTime() - andHoy.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days < 7;
  }

  getSubscriptionBorderClass(): string {
    if (this.isNearLimit() || this.isNearExpiration()) return 'border-danger';
    if (this.consumoPlan?.estado === 'ACTIVA') return 'border-primary';
    return 'border-warning';
  }

  getSubscriptionIconClass(): string {
    if (this.isNearLimit() || this.isNearExpiration()) return 'bg-soft-danger';
    return 'bg-soft-primary';
  }

  getProgressBarClass(): string {
    const p = this.getUsagePercent();
    if (p >= 90) return 'bg-danger';
    if (p >= 70) return 'bg-warning';
    return 'bg-primary';
  }

  getBadgeClass(): string {
    const p = this.getUsagePercent();
    if (p >= 90) return 'bg-soft-danger';
    if (p >= 70) return 'bg-soft-warning';
    return 'bg-soft-primary';
  }
}
