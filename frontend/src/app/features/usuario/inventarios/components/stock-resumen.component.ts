import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockResumen } from '../services/inventario-stock.service';

@Component({
  selector: 'app-stock-resumen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resumen-container">
      <h2>Resumen de Stock por Estado</h2>
      <div class="cards-grid">
        <div *ngFor="let item of resumen" class="card">
          <div class="card-header">
            <h3>{{ item.nombre }}</h3>
            <span class="codigo">{{ item.codigo }}</span>
          </div>
          <div class="card-body">
            <div class="estado-item disponible">
              <span class="label">Disponible</span>
              <span class="value">{{ item.disponible }}</span>
            </div>
            <div class="estado-item reservado">
              <span class="label">Reservado</span>
              <span class="value">{{ item.reservado }}</span>
            </div>
            <div class="estado-item danado">
              <span class="label">Dañado</span>
              <span class="value">{{ item.danado }}</span>
            </div>
            <div class="estado-item en-transito">
              <span class="label">En Tránsito</span>
              <span class="value">{{ item.en_transito }}</span>
            </div>
          </div>
          <div class="card-footer">
            <span class="total">Total: {{ item.total }}</span>
          </div>
        </div>
      </div>
      <div *ngIf="!resumen || resumen.length === 0" class="empty-state">
        <p>No hay datos de inventario disponibles</p>
      </div>
    </div>
  `,
  styles: [`
    .resumen-container { padding: 1.5rem; background: #f8fafc; border-radius: 12px; }
    .resumen-container h2 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0 0 1.5rem 0; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card-header { padding: 1rem; border-bottom: 1px solid #e2e8f0; }
    .card-header h3 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem 0; }
    .codigo { font-size: 0.75rem; color: #94a3b8; }
    .card-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .estado-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.875rem; }
    .estado-item.disponible { background: #dcfce7; }
    .estado-item.reservado { background: #fef3c7; }
    .estado-item.danado { background: #fee2e2; }
    .estado-item.en-transito { background: #dbeafe; }
    .label { font-weight: 600; color: #475569; }
    .value { font-weight: 700; color: #1e293b; font-size: 1.1rem; }
    .card-footer { padding: 1rem; background: #f1f5f9; border-top: 1px solid #e2e8f0; }
    .total { font-weight: 700; color: #3b82f6; }
    .empty-state { text-align: center; padding: 3rem 1rem; color: #94a3b8; }
  `]
})
export class StockResumenComponent {
  @Input() resumen: StockResumen[] | null = [];
}
