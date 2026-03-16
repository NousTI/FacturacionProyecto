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
      <div class="panel p-3 border-start border-4" 
           [ngClass]="(firmaInfo?.dias_restantes || 0) < 15 ? 'border-danger' : 'border-warning'">
        <div class="d-flex align-items-center gap-3">
          <div class="ql-icon" 
               [style.color]="(firmaInfo?.dias_restantes || 0) < 15 ? '#ef4444' : '#f59e0b'"
               [style.background]="(firmaInfo?.dias_restantes || 0) < 15 ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)'">
            <i class="bi bi-key-fill"></i>
          </div>
          <div *ngIf="firmaInfo; else noFirma">
            <div class="small text-muted fw-bold" style="font-size: 0.65rem;">FIRMA ELECTRÓNICA</div>
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

      <!-- 5. Consumo de Plan -->
      <div class="panel p-3" *ngIf="consumoPlan">
        <div class="d-flex justify-content-between mb-1">
          <span class="small fw-bold text-muted" style="font-size: 0.65rem;">
            CONSUMO DE PLAN
            <app-info-tooltip message="Porcentaje de documentos emitidos respecto al límite mensual de tu plan contratado."></app-info-tooltip>
          </span>
          <span class="small fw-bold">{{ consumoPlan.actual }} / {{ consumoPlan.limite }}</span>
        </div>
        <div class="progress mb-1" style="height: 6px;">
          <div class="progress-bar bg-success" 
               [style.width.%]="((consumoPlan.actual || 0) / (consumoPlan.limite || 1)) * 100"></div>
        </div>
        <div class="text-muted" style="font-size: 0.65rem;">
          {{ (consumoPlan.limite || 0) - (consumoPlan.actual || 0) }} documentos restantes
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .ql-icon {
      width: 34px; height: 34px;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }
  `]
})
export class StatusCardsComponent {
  @Input() firmaInfo?: { fecha: string; dias_restantes: number };
  @Input() consumoPlan?: { actual: number; limite: number };
}
