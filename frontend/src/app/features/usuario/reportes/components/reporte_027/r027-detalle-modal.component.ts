import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FinancialReportsService } from '../../services/financial-reports.service';

const TITULOS: Record<string, string> = {
  '401': 'Ventas gravadas (tarifa > 0%) — Casillero 401 / 411',
  '403': 'Ventas tarifa 0% — Casillero 403',
  '402': 'Notas de crédito emitidas — Casillero 402 / 412',
  '500': 'Compras con IVA (gastos) — Casillero 500 / 510',
  '507': 'Compras tarifa 0% (gastos) — Casillero 507',
};

@Component({
  selector: 'app-r027-detalle-modal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
<div class="modal-backdrop" (click)="cerrar.emit()">
  <div class="modal-box" (click)="$event.stopPropagation()">

    <div class="modal-head">
      <div>
        <span class="modal-cas">{{ casillero }}</span>
        <h5 class="modal-title">{{ titulo }}</h5>
        <p class="modal-sub">{{ fechaInicio }} — {{ fechaFin }}</p>
      </div>
      <button class="modal-close" (click)="cerrar.emit()"><i class="bi bi-x-lg"></i></button>
    </div>

    <div class="modal-body">

      <!-- Loading -->
      <div class="modal-loading" *ngIf="cargando">
        <div class="spinner"></div>
        <span>Cargando registros...</span>
      </div>

      <!-- Vacío -->
      <div class="modal-empty" *ngIf="!cargando && filas.length === 0">
        <i class="bi bi-inbox"></i>
        <p>No hay registros en este período.</p>
      </div>

      <!-- Tabla 401 -->
      <table class="det-table" *ngIf="!cargando && filas.length > 0 && casillero === '401'">
        <thead><tr>
          <th>Fecha</th><th>N° Factura</th><th>Cliente</th>
          <th class="num">Tarifa %</th><th class="num">Base imponible</th><th class="num">IVA</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let r of filas">
            <td>{{ r.fecha }}</td>
            <td class="mono">{{ r.numero_factura }}</td>
            <td class="client">{{ r.cliente }}</td>
            <td class="num">{{ r.tarifa }}%</td>
            <td class="num">{{ r.base_imponible | currency }}</td>
            <td class="num iva">{{ r.valor_iva | currency }}</td>
          </tr>
        </tbody>
        <tfoot><tr>
          <td colspan="4" class="tot-lbl">TOTAL</td>
          <td class="num tot">{{ totalBase | currency }}</td>
          <td class="num tot iva">{{ totalIva | currency }}</td>
        </tr></tfoot>
      </table>

      <!-- Tabla 403 -->
      <table class="det-table" *ngIf="!cargando && filas.length > 0 && casillero === '403'">
        <thead><tr>
          <th>Fecha</th><th>N° Factura</th><th>Cliente</th><th class="num">Base imponible</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let r of filas">
            <td>{{ r.fecha }}</td>
            <td class="mono">{{ r.numero_factura }}</td>
            <td class="client">{{ r.cliente }}</td>
            <td class="num">{{ r.base_imponible | currency }}</td>
          </tr>
        </tbody>
        <tfoot><tr>
          <td colspan="3" class="tot-lbl">TOTAL</td>
          <td class="num tot">{{ totalBase | currency }}</td>
        </tr></tfoot>
      </table>

      <!-- Tabla 402 -->
      <table class="det-table" *ngIf="!cargando && filas.length > 0 && casillero === '402'">
        <thead><tr>
          <th>Fecha</th><th>N° Nota Crédito</th><th>Cliente</th>
          <th class="num">Base imponible</th><th class="num">IVA</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let r of filas">
            <td>{{ r.fecha }}</td>
            <td class="mono">{{ r.numero_nota_credito }}</td>
            <td class="client">{{ r.cliente }}</td>
            <td class="num">{{ r.base_imponible | currency }}</td>
            <td class="num iva">{{ r.valor_iva | currency }}</td>
          </tr>
        </tbody>
        <tfoot><tr>
          <td colspan="3" class="tot-lbl">TOTAL</td>
          <td class="num tot">{{ totalBase | currency }}</td>
          <td class="num tot iva">{{ totalIva | currency }}</td>
        </tr></tfoot>
      </table>

      <!-- Tabla 500 -->
      <table class="det-table" *ngIf="!cargando && filas.length > 0 && casillero === '500'">
        <thead><tr>
          <th>Fecha</th><th>Comprobante</th><th>Proveedor</th><th>Descripción</th>
          <th class="num">Tarifa %</th><th class="num">Base</th><th class="num">IVA</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let r of filas">
            <td>{{ r.fecha }}</td>
            <td class="mono">{{ r.numero_comprobante || '—' }}</td>
            <td class="client">{{ r.proveedor || '—' }}</td>
            <td class="desc">{{ r.descripcion || '—' }}</td>
            <td class="num">{{ r.tarifa }}%</td>
            <td class="num">{{ r.base_imponible | currency }}</td>
            <td class="num iva">{{ r.valor_iva | currency }}</td>
          </tr>
        </tbody>
        <tfoot><tr>
          <td colspan="5" class="tot-lbl">TOTAL</td>
          <td class="num tot">{{ totalBase | currency }}</td>
          <td class="num tot iva">{{ totalIva | currency }}</td>
        </tr></tfoot>
      </table>

      <!-- Tabla 507 -->
      <table class="det-table" *ngIf="!cargando && filas.length > 0 && casillero === '507'">
        <thead><tr>
          <th>Fecha</th><th>Comprobante</th><th>Proveedor</th><th>Descripción</th>
          <th class="num">Base</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let r of filas">
            <td>{{ r.fecha }}</td>
            <td class="mono">{{ r.numero_comprobante || '—' }}</td>
            <td class="client">{{ r.proveedor || '—' }}</td>
            <td class="desc">{{ r.descripcion || '—' }}</td>
            <td class="num">{{ r.base_imponible | currency }}</td>
          </tr>
        </tbody>
        <tfoot><tr>
          <td colspan="4" class="tot-lbl">TOTAL</td>
          <td class="num tot">{{ totalBase | currency }}</td>
        </tr></tfoot>
      </table>

    </div>
  </div>
</div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.55);
      z-index: 9999; display: flex; align-items: center; justify-content: center;
      padding: 1rem;
    }
    .modal-box {
      background: #fff; border-radius: 18px; width: 100%; max-width: 900px;
      max-height: 85vh; display: flex; flex-direction: column;
      box-shadow: 0 25px 60px -10px rgba(0,0,0,0.35);
      overflow: hidden;
    }
    .modal-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .modal-cas {
      display: inline-block; background: var(--primary-color); color: #fff;
      font-size: 0.7rem; font-weight: 800; font-family: monospace;
      padding: 2px 10px; border-radius: 6px; margin-bottom: 4px;
    }
    .modal-title { font-size: 1rem; font-weight: 800; color: black; margin: 0; }
    .modal-sub   { font-size: 0.75rem; color: #94a3b8; margin: 2px 0 0; }
    .modal-close {
      background: none; border: none; font-size: 1.1rem; color: #94a3b8;
      cursor: pointer; padding: 4px 8px; border-radius: 8px; line-height: 1;
      transition: background 0.15s;
    }
    .modal-close:hover { background: #f1f5f9; color: black; }

    .modal-body { overflow-y: auto; flex: 1; padding: 1rem 1.5rem 1.5rem; }

    .modal-loading, .modal-empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 0.75rem; padding: 3rem 0; color: #94a3b8;
    }
    .modal-empty i { font-size: 2.5rem; }
    .modal-empty p { margin: 0; font-size: 0.9rem; }
    .spinner {
      width: 28px; height: 28px; border: 3px solid #e2e8f0;
      border-top-color: #6366f1; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .det-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .det-table th {
      background: #f8fafc; color: #475569; font-size: 0.7rem;
      text-transform: uppercase; letter-spacing: 0.04em;
      padding: 8px 10px; border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }
    .det-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .det-table tr:last-child td { border-bottom: none; }
    .det-table tr:hover td { background: #f8fafc; }
    .num  { text-align: right; font-family: monospace; }
    .mono { font-family: monospace; font-size: 0.78rem; color: #64748b; }
    .client { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .desc   { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #64748b; }
    .iva    { color: #1d4ed8; font-weight: 600; }

    tfoot td { padding: 10px 10px; background: #f8fafc; border-top: 2px solid #e2e8f0; }
    .tot-lbl { font-weight: 700; font-size: 0.78rem; text-transform: uppercase; color: #475569; }
    .tot     { font-weight: 800; color: black; }
  `]
})
export class R027DetalleModalComponent implements OnInit {
  @Input() casillero = '';
  @Input() fechaInicio = '';
  @Input() fechaFin = '';
  @Output() cerrar = new EventEmitter<void>();

  filas: any[] = [];
  cargando = false;

  get titulo() { return TITULOS[this.casillero] || `Casillero ${this.casillero}`; }

  get totalBase(): number {
    return this.filas.reduce((s, r) => s + (r.base_imponible || 0), 0);
  }
  get totalIva(): number {
    return this.filas.reduce((s, r) => s + (r.valor_iva || 0), 0);
  }

  constructor(private svc: FinancialReportsService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargar();
  }

  private cargar() {
    this.cargando = true;
    this.filas = [];
    this.svc.obtenerDetalleCasilleroR027(this.casillero, this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (data) => { this.filas = data; this.cargando = false; this.cdr.detectChanges(); },
        error: () => { this.cargando = false; this.cdr.detectChanges(); }
      });
  }
}


