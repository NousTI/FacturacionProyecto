import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { IvaR027Report } from '../../services/financial-reports.service';

@Component({
  selector: 'app-r027-iva',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  template: `
<div class="fade-in">

  <!-- ══ BANNER FECHA LÍMITE ══════════════════════════════════════════ -->
  <div class="deadline-banner mb-4" [class.urgent]="data.fecha_limite?.urgente" [class.vencida]="data.fecha_limite?.vencida">
    <div class="deadline-left">
      <i class="bi" [class.bi-exclamation-triangle-fill]="data.fecha_limite?.urgente || data.fecha_limite?.vencida" [class.bi-calendar-check]="!data.fecha_limite?.urgente && !data.fecha_limite?.vencida"></i>
      <div>
        <span class="deadline-main">
          {{ data.fecha_limite?.vencida ? 'Declaración vencida' : 'Recuerda subir tu declaración hasta el' }}
          <strong>{{ data.fecha_limite?.fecha_limite }}</strong>
        </span>
        <span class="deadline-sub" *ngIf="!data.fecha_limite?.vencida && data.fecha_limite?.dias_restantes !== null">
          quedan <strong>{{ data.fecha_limite?.dias_restantes }}</strong> día(s)
        </span>
      </div>
    </div>
    <span class="deadline-tooltip" [title]="tooltipRuc">
      <i class="bi bi-info-circle-fill"></i>
    </span>
  </div>

  <!-- ══ NOTA FORMULARIO EN CERO ═══════════════════════════════════════ -->
  <div class="info-banner mb-4" *ngIf="esPeriodoEnCero">
    <i class="bi bi-info-circle-fill me-2"></i>
    <span>Sin ventas ni compras en el período. La normativa 2026 exige presentar el Formulario 104 <strong>en cero</strong> dentro del plazo para evitar multas.</span>
  </div>

  <!-- ══ KPIs SUPERIORES ════════════════════════════════════════════════ -->
  <div class="kpi-grid mb-4">

    <div class="kpi-card red">
      <span class="label">IVA a pagar SRI</span>
      <span class="value">{{ data.kpis?.iva_a_pagar?.valor | currency }}</span>
      <span class="subtext">proyectado</span>
    </div>

    <div class="kpi-card teal">
      <span class="label">Crédito tributario</span>
      <span class="value">{{ data.kpis?.credito_tributario?.valor | currency }}</span>
      <span class="subtext">disponible</span>
    </div>

    <div class="kpi-card blue">
      <span class="label">Ventas gravadas</span>
      <span class="value">{{ data.kpis?.ventas_gravadas?.valor | currency }}</span>
      <span class="subtext">base imponible</span>
    </div>

    <div class="kpi-card indigo">
      <span class="label">
        Factor de este mes
        <span class="kpi-tooltip-icon" [title]="data.kpis?.factor?.tooltip || ''">
          <i class="bi bi-info-circle-fill ms-1"></i>
        </span>
      </span>
      <span class="value">{{ data.kpis?.factor?.valor | number:'1.4-4' }}</span>
      <span class="subtext">proporcionalidad</span>
    </div>

  </div>

  <!-- ══ ALERTA NC > VENTAS ══════════════════════════════════════════════ -->
  <div class="alert-banner mb-3" *ngIf="data.bloque_400?.alertas?.nc_supera_ventas">
    <i class="bi bi-exclamation-triangle-fill me-2"></i>
    <span><strong>Advertencia:</strong> Las notas de crédito emitidas (casillero 402) superan las ventas del período (casillero 401). Verifique con su contador.</span>
  </div>

  <!-- ══ BLOQUE 400: VENTAS ══════════════════════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header ventas">
      <div class="bloque-badge">Sección 400</div>
      <h5><i class="bi bi-receipt me-2"></i>Resumen de Ventas</h5>
      <p>Facturas emitidas y autorizadas en el período</p>
    </div>
    <div class="table-responsive">
      <table class="table formulario-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th class="text-center">Casillero</th>
            <th class="text-end">Valor Bruto</th>
            <th class="text-end">Valor Neto (Base)</th>
            <th class="text-end">Impuesto generado</th>
          </tr>
        </thead>
        <tbody>
          <!-- 401/411: Ventas gravadas -->
          <tr class="hover-row">
            <td class="desc-cell">
              <span class="desc-title">Ventas locales tarifa diferente de cero</span>
              <span class="desc-sub">Facturas electrónicas autorizadas con IVA</span>
            </td>
            <td class="text-center"><span class="casillero-badge azul">401 / 411</span></td>
            <td class="text-end font-mono">{{ data.bloque_400?.c401_bruto | currency }}</td>
            <td class="text-end font-bold">{{ data.bloque_400?.c401_neto | currency }}</td>
            <td class="text-end impuesto">{{ data.bloque_400?.c411_neto | currency }}</td>
          </tr>

          <!-- 403: Ventas tarifa 0% sin derecho -->
          <tr class="hover-row">
            <td class="desc-cell">
              <span class="desc-title">Ventas locales tarifa 0% (sin derecho a crédito)</span>
              <span class="desc-sub">Productos/servicios exentos. Casillero 405 (con derecho) pendiente de configuración.</span>
            </td>
            <td class="text-center"><span class="casillero-badge gris">403</span></td>
            <td class="text-end font-mono">{{ data.bloque_400?.c403 | currency }}</td>
            <td class="text-end font-bold">{{ data.bloque_400?.c403 | currency }}</td>
            <td class="text-end text-muted-sm">$0.00</td>
          </tr>

          <!-- 407/408: Exportaciones — sin data -->
          <tr class="hover-row no-data-row">
            <td class="desc-cell">
              <span class="desc-title">Exportaciones de Bienes / Servicios</span>
              <span class="desc-sub">No aplica — sin módulo de exportaciones</span>
            </td>
            <td class="text-center"><span class="casillero-badge gris">407 / 408</span></td>
            <td class="text-end text-muted-sm">—</td>
            <td class="text-end text-muted-sm">—</td>
            <td class="text-end text-muted-sm">—</td>
          </tr>

          <!-- 402/412: Notas de crédito emitidas -->
          <tr class="hover-row nc-row">
            <td class="desc-cell">
              <span class="desc-title">(-) Notas de crédito emitidas (tarifa &gt; 0%)</span>
              <span class="desc-sub">Se reportan en el mes de emisión de la nota, no de la factura original</span>
            </td>
            <td class="text-center"><span class="casillero-badge rojo">402 / 412</span></td>
            <td class="text-end font-mono text-danger">{{ data.bloque_400?.c402 | currency }}</td>
            <td class="text-end font-bold text-danger">{{ data.bloque_400?.c402 | currency }}</td>
            <td class="text-end text-danger">{{ data.bloque_400?.c412 | currency }}</td>
          </tr>

          <!-- 499: Total -->
          <tr class="total-row">
            <td class="desc-cell"><span class="desc-title fw-bold">TOTAL IVA GENERADO EN VENTAS</span></td>
            <td class="text-center"><span class="casillero-badge verde">499</span></td>
            <td class="text-end">—</td>
            <td class="text-end">—</td>
            <td class="text-end font-bold total-value">{{ data.bloque_400?.c499 | currency }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ══ BLOQUE 500: COMPRAS ═════════════════════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header compras">
      <div class="bloque-badge">Sección 500</div>
      <h5><i class="bi bi-bag-check me-2"></i>Resumen de Adquisiciones y Pagos</h5>
      <p>{{ data.bloque_500?.nota_compras }}</p>
    </div>
    <div class="table-responsive">
      <table class="table formulario-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th class="text-center">Casillero</th>
            <th class="text-end">Valor Bruto</th>
            <th class="text-end">Valor Neto (Base)</th>
            <th class="text-end">IVA pagado</th>
          </tr>
        </thead>
        <tbody>
          <!-- 500/510: Compras gravadas -->
          <tr class="hover-row">
            <td class="desc-cell">
              <span class="desc-title">Adquisiciones gravadas (con derecho a crédito tributario)</span>
              <span class="desc-sub">Gastos con IVA &gt; 0% registrados en el módulo de gastos</span>
            </td>
            <td class="text-center"><span class="casillero-badge azul">500 / 510</span></td>
            <td class="text-end font-mono">{{ data.bloque_500?.c500 | currency }}</td>
            <td class="text-end font-bold">{{ data.bloque_500?.c500 | currency }}</td>
            <td class="text-end impuesto">{{ data.bloque_500?.c510 | currency }}</td>
          </tr>

          <!-- 507: Compras tarifa 0% -->
          <tr class="hover-row">
            <td class="desc-cell">
              <span class="desc-title">Adquisiciones tarifa 0% / RIMPE</span>
              <span class="desc-sub">Gastos sin IVA — incluye compras a negocios populares</span>
            </td>
            <td class="text-center"><span class="casillero-badge gris">507</span></td>
            <td class="text-end font-mono">{{ data.bloque_500?.c507 | currency }}</td>
            <td class="text-end font-bold">{{ data.bloque_500?.c507 | currency }}</td>
            <td class="text-end text-muted-sm">$0.00</td>
          </tr>

          <!-- 509/519: Sin derecho — sin data -->
          <tr class="hover-row no-data-row">
            <td class="desc-cell">
              <span class="desc-title">Adquisiciones gravadas sin derecho a crédito</span>
              <span class="desc-sub">Sin clasificación disponible — requiere categorización de gastos</span>
            </td>
            <td class="text-center"><span class="casillero-badge gris">509 / 519</span></td>
            <td class="text-end text-muted-sm">—</td>
            <td class="text-end text-muted-sm">—</td>
            <td class="text-end text-muted-sm">—</td>
          </tr>

          <!-- 503/504: Exterior — sin data -->
          <tr class="hover-row no-data-row">
            <td class="desc-cell">
              <span class="desc-title">Compras en el exterior (ej. publicidad Facebook/Google)</span>
              <span class="desc-sub">Sin datos — ingresar manualmente en el formulario 104</span>
            </td>
            <td class="text-center"><span class="casillero-badge gris">503 / 504</span></td>
            <td class="text-end text-muted-sm">—</td>
            <td class="text-end text-muted-sm">—</td>
            <td class="text-end text-muted-sm">—</td>
          </tr>

          <!-- 563: Factor de proporcionalidad -->
          <tr class="hover-row factor-row">
            <td class="desc-cell">
              <span class="desc-title">
                Factor de proporcionalidad
                <span class="kpi-tooltip-icon ms-1" [title]="data.kpis?.factor?.tooltip || ''">
                  <i class="bi bi-info-circle-fill"></i>
                </span>
              </span>
              <span class="desc-sub">Fórmula: (401) / (401 + 403)</span>
            </td>
            <td class="text-center"><span class="casillero-badge indigo">563</span></td>
            <td class="text-end">—</td>
            <td class="text-end font-bold">{{ data.bloque_500?.c563 | number:'1.4-4' }}</td>
            <td class="text-end">—</td>
          </tr>

          <!-- 564: Crédito tributario aplicable -->
          <tr class="hover-row">
            <td class="desc-cell">
              <span class="desc-title">Crédito tributario aplicable</span>
              <span class="desc-sub">Fórmula: 510 × 563</span>
            </td>
            <td class="text-center"><span class="casillero-badge verde">564</span></td>
            <td class="text-end">—</td>
            <td class="text-end font-bold text-success">{{ data.bloque_500?.c564 | currency }}</td>
            <td class="text-end">—</td>
          </tr>

          <!-- 599: Total -->
          <tr class="total-row">
            <td class="desc-cell"><span class="desc-title fw-bold">TOTAL IVA PAGADO EN COMPRAS</span></td>
            <td class="text-center"><span class="casillero-badge verde">599</span></td>
            <td class="text-end">—</td>
            <td class="text-end">—</td>
            <td class="text-end font-bold total-value">{{ data.bloque_500?.c599 | currency }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ══ BLOQUE 600: LIQUIDACIÓN ════════════════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header liquidacion">
      <div class="bloque-badge">Sección 600</div>
      <h5><i class="bi bi-calculator me-2"></i>Resumen Impositivo — Liquidación</h5>
      <p>Resultado neto entre IVA ventas y crédito tributario de compras</p>
    </div>

    <!-- Notas de arrastre -->
    <div class="nota-inline mb-3" *ngIf="data.bloque_600?.nota_arrastre">
      <i class="bi bi-exclamation-circle me-1"></i> {{ data.bloque_600.nota_arrastre }}
    </div>
    <div class="nota-inline mb-3" *ngIf="data.bloque_600?.nota_retenciones_recibidas">
      <i class="bi bi-exclamation-circle me-1"></i> {{ data.bloque_600.nota_retenciones_recibidas }}
    </div>

    <div class="table-responsive">
      <table class="table formulario-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th class="text-center">Casillero</th>
            <th class="text-end">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover-row" [class.highlight-positive]="(data.bloque_600?.c601 ?? 0) > 0">
            <td class="desc-cell">
              <span class="desc-title">Impuesto causado (si 499 &gt; 564)</span>
              <span class="desc-sub">Fórmula: 499 − 564</span>
            </td>
            <td class="text-center"><span class="casillero-badge rojo">601</span></td>
            <td class="text-end font-bold">{{ data.bloque_600?.c601 | currency }}</td>
          </tr>

          <tr class="hover-row" [class.highlight-positive]="(data.bloque_600?.c602 ?? 0) > 0">
            <td class="desc-cell">
              <span class="desc-title">Crédito tributario para el próximo mes (si 564 &gt; 499)</span>
              <span class="desc-sub">Fórmula: 564 − 499</span>
            </td>
            <td class="text-center"><span class="casillero-badge verde">602</span></td>
            <td class="text-end font-bold text-success">{{ data.bloque_600?.c602 | currency }}</td>
          </tr>

          <tr class="hover-row no-data-row">
            <td class="desc-cell">
              <span class="desc-title">Arrastre crédito tributario por adquisiciones (mes anterior)</span>
              <span class="desc-sub">Sin historial de declaraciones — verificar manualmente</span>
            </td>
            <td class="text-center"><span class="casillero-badge gris">605</span></td>
            <td class="text-end text-muted-sm">—</td>
          </tr>

          <tr class="hover-row no-data-row">
            <td class="desc-cell">
              <span class="desc-title">Arrastre crédito tributario por retenciones (mes anterior)</span>
              <span class="desc-sub">Sin historial de declaraciones — verificar manualmente</span>
            </td>
            <td class="text-center"><span class="casillero-badge gris">606</span></td>
            <td class="text-end text-muted-sm">—</td>
          </tr>

          <tr class="hover-row no-data-row">
            <td class="desc-cell">
              <span class="desc-title">Retenciones en la fuente de IVA recibidas en el período</span>
              <span class="desc-sub">Sin comprobantes de retención registrados</span>
            </td>
            <td class="text-center"><span class="casillero-badge gris">609</span></td>
            <td class="text-end text-muted-sm">—</td>
          </tr>

          <tr class="total-row">
            <td class="desc-cell"><span class="desc-title fw-bold">TOTAL IMPUESTO A PAGAR (601 − 605 − 606 − 609)</span></td>
            <td class="text-center"><span class="casillero-badge rojo">699</span></td>
            <td class="text-end font-bold total-value">{{ data.bloque_600?.c699 | currency }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ══ BLOQUE 700: RETENCIONES EFECTUADAS ════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header retenciones">
      <div class="bloque-badge">Sección 700</div>
      <h5><i class="bi bi-percent me-2"></i>Agentes de Retención</h5>
      <p>Retenciones efectuadas a proveedores en el período</p>
    </div>

    <div class="nota-inline mb-3" *ngIf="data.bloque_700?.nota">
      <i class="bi bi-info-circle me-1"></i> {{ data.bloque_700.nota }}
    </div>

    <div class="table-responsive">
      <table class="table formulario-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th class="text-center">Casillero</th>
            <th class="text-end">%</th>
            <th class="text-end">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover-row no-data-row">
            <td class="desc-cell"><span class="desc-title">Retención servicios profesionales / arrendamiento</span></td>
            <td class="text-center"><span class="casillero-badge gris">721</span></td>
            <td class="text-end text-muted-sm">10%</td>
            <td class="text-end text-muted-sm">—</td>
          </tr>
          <tr class="hover-row no-data-row">
            <td class="desc-cell"><span class="desc-title">Retención bienes muebles</span></td>
            <td class="text-center"><span class="casillero-badge gris">725</span></td>
            <td class="text-end text-muted-sm">30%</td>
            <td class="text-end text-muted-sm">—</td>
          </tr>
          <tr class="hover-row no-data-row">
            <td class="desc-cell"><span class="desc-title">Retención servicios / comisiones</span></td>
            <td class="text-center"><span class="casillero-badge gris">727</span></td>
            <td class="text-end text-muted-sm">70%</td>
            <td class="text-end text-muted-sm">—</td>
          </tr>
          <tr class="hover-row no-data-row">
            <td class="desc-cell"><span class="desc-title">Retención publicidad, pagos al exterior, RIMPE</span></td>
            <td class="text-center"><span class="casillero-badge gris">729</span></td>
            <td class="text-end text-muted-sm">100%</td>
            <td class="text-end text-muted-sm">—</td>
          </tr>
          <tr class="total-row">
            <td class="desc-cell"><span class="desc-title fw-bold">TOTAL RETENCIONES A PAGAR AL SRI</span></td>
            <td class="text-center"><span class="casillero-badge gris">799</span></td>
            <td class="text-end">—</td>
            <td class="text-end font-bold text-muted-sm">$0.00</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ══ BLOQUE 900: TOTAL A PAGAR ══════════════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header total-pago">
      <div class="bloque-badge">Sección 900</div>
      <h5><i class="bi bi-cash-stack me-2"></i>Total a Pagar</h5>
      <p>Comprobante de pago final</p>
    </div>
    <div class="table-responsive">
      <table class="table formulario-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th class="text-center">Casillero</th>
            <th class="text-end">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover-row">
            <td class="desc-cell"><span class="desc-title">Impuesto a pagar por percepción (viene del 699)</span></td>
            <td class="text-center"><span class="casillero-badge rojo">801</span></td>
            <td class="text-end font-bold">{{ data.bloque_900?.c801 | currency }}</td>
          </tr>
          <tr class="hover-row">
            <td class="desc-cell"><span class="desc-title">Impuesto a pagar por retención (viene del 799)</span></td>
            <td class="text-center"><span class="casillero-badge gris">802</span></td>
            <td class="text-end text-muted-sm">$0.00</td>
          </tr>
          <tr class="hover-row no-data-row">
            <td class="desc-cell">
              <span class="desc-title">Interés por mora</span>
              <span class="desc-sub">Solo aplica si la declaración es tardía</span>
            </td>
            <td class="text-center"><span class="casillero-badge gris">897</span></td>
            <td class="text-end text-muted-sm">—</td>
          </tr>
          <tr class="hover-row no-data-row">
            <td class="desc-cell">
              <span class="desc-title">Multas</span>
              <span class="desc-sub">Solo aplica si la declaración es tardía</span>
            </td>
            <td class="text-center"><span class="casillero-badge gris">898</span></td>
            <td class="text-end text-muted-sm">—</td>
          </tr>
          <tr class="total-row grand-total">
            <td class="desc-cell"><span class="desc-title fw-bold">TOTAL A PAGAR AL SRI</span></td>
            <td class="text-center"><span class="casillero-badge verde">999</span></td>
            <td class="text-end font-bold grand-total-value">{{ data.bloque_900?.c999 | currency }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ══ CALENDARIZACIÓN SRI ════════════════════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header calendario">
      <div class="bloque-badge">Referencia</div>
      <h5><i class="bi bi-calendar3 me-2"></i>Calendarización SRI — Fechas Límite de Declaración</h5>
      <p>Según el noveno dígito de tu RUC: <strong>{{ data.empresa?.ruc }}</strong> → dígito <strong>{{ data.fecha_limite?.noveno_digito }}</strong></p>
    </div>
    <div class="calendario-grid">
      <div class="cal-item" *ngFor="let cal of calendario" [class.active]="cal.digito === data.fecha_limite?.noveno_digito">
        <span class="cal-digito">{{ cal.digito }}</span>
        <span class="cal-dia">día {{ cal.dia }}</span>
      </div>
    </div>
    <p class="cal-nota mt-2">Si el día cae feriado o fin de semana, se traslada al siguiente día hábil.</p>
  </div>

</div>
  `,
  styles: [`
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* ── DEADLINE BANNER ── */
    .deadline-banner {
      display: flex; align-items: center; justify-content: space-between;
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px;
      padding: 0.85rem 1.25rem; color: #166534; gap: 1rem;
    }
    .deadline-banner.urgent  { background: #fffbeb; border-color: #fde68a; color: #854d0e; }
    .deadline-banner.vencida { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .deadline-left { display: flex; align-items: center; gap: 0.75rem; font-size: 0.88rem; }
    .deadline-left i { font-size: 1.2rem; flex-shrink: 0; }
    .deadline-main { display: block; font-weight: 600; }
    .deadline-sub  { display: block; font-size: 0.78rem; opacity: 0.8; }
    .deadline-tooltip { cursor: help; opacity: 0.6; font-size: 1rem; }
    .deadline-tooltip:hover { opacity: 1; }

    /* ── INFO / ALERT BANNERS ── */
    .info-banner {
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px;
      padding: 0.85rem 1.25rem; font-size: 0.85rem; color: #1e40af;
      display: flex; align-items: flex-start; gap: 0.25rem;
    }
    .alert-banner {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px;
      padding: 0.75rem 1.25rem; font-size: 0.85rem; color: #991b1b;
      display: flex; align-items: flex-start; gap: 0.5rem;
    }
    .nota-inline {
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
      padding: 0.6rem 1rem; font-size: 0.8rem; color: #854d0e;
      margin: 0 1.75rem;
    }

    /* ── KPI GRID ── */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
    .kpi-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 20px;
      padding: 1.4rem 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .kpi-card.red    { border-top: 4px solid #ef4444; }
    .kpi-card.teal   { border-top: 4px solid #14b8a6; }
    .kpi-card.blue   { border-top: 4px solid #3b82f6; }
    .kpi-card.indigo { border-top: 4px solid #6366f1; }
    .label   { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; }
    .value   { font-size: 1.65rem; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .subtext { font-size: 0.72rem; color: #94a3b8; }
    .kpi-tooltip-icon { color: #94a3b8; cursor: help; font-size: 0.8rem; }
    .kpi-tooltip-icon:hover { color: #6366f1; }

    /* ── BLOQUES CARD ── */
    .bloque-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden;
    }
    .bloque-header {
      padding: 1.25rem 1.75rem 0.75rem; border-bottom: 1px solid #f1f5f9;
    }
    .bloque-header h5 { font-weight: 800; color: #1e293b; margin-bottom: 0.2rem; font-size: 1rem; }
    .bloque-header p  { font-size: 0.78rem; color: #64748b; margin: 0; }
    .bloque-badge {
      display: inline-block; font-size: 0.62rem; font-weight: 800; letter-spacing: 0.08em;
      text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 6px;
      background: #f1f5f9; color: #475569; margin-bottom: 0.4rem;
    }
    .bloque-header.ventas      { border-left: 4px solid #3b82f6; }
    .bloque-header.compras     { border-left: 4px solid #14b8a6; }
    .bloque-header.liquidacion { border-left: 4px solid #f59e0b; }
    .bloque-header.retenciones { border-left: 4px solid #8b5cf6; }
    .bloque-header.total-pago  { border-left: 4px solid #ef4444; }
    .bloque-header.calendario  { border-left: 4px solid #6366f1; }

    /* ── TABLA FORMULARIO ── */
    .formulario-table thead th {
      background: #f8fafc; border: none; font-size: 0.68rem;
      text-transform: uppercase; color: #64748b; padding: 0.75rem 1rem; font-weight: 700;
    }
    .formulario-table tbody td {
      border-bottom: 1px solid #f1f5f9; padding: 0.8rem 1rem;
      vertical-align: middle; font-size: 0.86rem;
    }
    .hover-row:hover { background: #f8fafc; }
    .no-data-row td  { opacity: 0.55; font-style: italic; }
    .nc-row td       { background: #fff5f5 !important; }
    .nc-row:hover td { background: #fef2f2 !important; }
    .factor-row      { background: #faf5ff; }

    .desc-cell       { max-width: 360px; }
    .desc-title      { display: block; font-weight: 600; color: #334155; font-size: 0.86rem; }
    .desc-sub        { display: block; font-size: 0.74rem; color: #94a3b8; margin-top: 2px; }

    /* Casillero badges */
    .casillero-badge {
      display: inline-block; padding: 0.25rem 0.55rem; border-radius: 8px;
      font-size: 0.72rem; font-weight: 800; letter-spacing: 0.3px; font-family: monospace;
    }
    .casillero-badge.azul   { background: #eff6ff; color: #1d4ed8; }
    .casillero-badge.verde  { background: #f0fdf4; color: #166534; }
    .casillero-badge.rojo   { background: #fef2f2; color: #991b1b; }
    .casillero-badge.gris   { background: #f1f5f9; color: #475569; }
    .casillero-badge.indigo { background: #eef2ff; color: #4338ca; }

    .font-mono   { font-family: monospace; font-size: 0.84rem; }
    .font-bold   { font-weight: 800; color: #1e293b; }
    .text-muted-sm { font-size: 0.82rem; color: #94a3b8; }
    .impuesto    { font-weight: 700; color: #1d4ed8; }

    /* Filas totales */
    .total-row td    { background: #f8fafc; border-top: 2px solid #e2e8f0 !important; font-weight: 700; }
    .total-value     { font-size: 1rem; color: #1e293b; }
    .grand-total td  { background: #0f172a !important; }
    .grand-total-value { font-size: 1.1rem; color: #fff !important; }
    .grand-total .desc-title { color: #fff !important; }
    .grand-total .casillero-badge { background: #22c55e !important; color: #fff !important; }

    .highlight-positive td { background: #fff7ed; }

    /* ── CALENDARIZACIÓN ── */
    .calendario-grid {
      display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 1rem 1.75rem;
    }
    .cal-item {
      display: flex; flex-direction: column; align-items: center;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 0.6rem 1rem; min-width: 64px; gap: 2px;
    }
    .cal-item.active { background: #1e293b; border-color: #1e293b; }
    .cal-item.active .cal-digito,
    .cal-item.active .cal-dia { color: #fff !important; }
    .cal-digito { font-size: 1.2rem; font-weight: 900; color: #1e293b; }
    .cal-dia    { font-size: 0.65rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .cal-nota   { font-size: 0.75rem; color: #94a3b8; padding: 0 1.75rem 1rem; margin: 0; }
  `]
})
export class R027IvaComponent implements OnChanges {
  @Input() data!: IvaR027Report;

  readonly calendario = [
    { digito: '1', dia: 10 }, { digito: '2', dia: 12 }, { digito: '3', dia: 14 },
    { digito: '4', dia: 16 }, { digito: '5', dia: 18 }, { digito: '6', dia: 20 },
    { digito: '7', dia: 22 }, { digito: '8', dia: 24 }, { digito: '9', dia: 26 },
    { digito: '0', dia: 28 },
  ];

  get esPeriodoEnCero(): boolean {
    return (this.data?.bloque_400?.c499 ?? 0) === 0 &&
           (this.data?.bloque_500?.c510 ?? 0) === 0;
  }

  get tooltipRuc(): string {
    const ruc = this.data?.empresa?.ruc || '—';
    const noveno = this.data?.fecha_limite?.noveno_digito || '?';
    const regimen = this.data?.empresa?.regimen === 'rimpe' ? 'semestral (RIMPE)' : 'mensual';
    const fecha = this.data?.fecha_limite?.fecha_limite || '—';
    return `Tu RUC: ${ruc} — noveno dígito: ${noveno}. Declaración ${regimen} con fecha máxima: ${fecha}. Si el día cae feriado, se traslada al siguiente día hábil.`;
  }

  ngOnChanges() {}
}
