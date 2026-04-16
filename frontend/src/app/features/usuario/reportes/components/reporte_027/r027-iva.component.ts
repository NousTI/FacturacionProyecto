import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { IvaR027Report } from '../../services/financial-reports.service';
import { InfoTooltipComponent } from './info-tooltip.component';

@Component({
  selector: 'app-r027-iva',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, InfoTooltipComponent],
  template: `
<div class="fade-in">

  <!-- ══ ENCABEZADO ════════════════════════════════════════════════════ -->
  <div class="page-header mb-4">
    <div class="page-header-left">
      <h4 class="page-title">R-027 — Reporte de IVA (Formulario 104)</h4>
      <p class="page-sub">Datos listos para la declaración mensual al SRI. Calcula automáticamente el IVA a pagar descontando compras gravadas.</p>
      <div class="header-meta-row">
        <span class="meta-badge" [class.rimpe]="data.empresa?.regimen === 'rimpe'">
          <i class="bi bi-building me-1"></i>
          {{ data.empresa?.regimen === 'rimpe' ? 'Régimen RIMPE — Declaración semestral' : 'Régimen General — Declaración mensual' }}
        </span>
        <span class="meta-badge neutral">
          <i class="bi bi-calendar me-1"></i>Año fiscal: {{ anioFiscal }}
        </span>
        <span class="meta-badge neutral">
          <i class="bi bi-clock me-1"></i>Período: {{ periodoTexto }}
        </span>
      </div>
    </div>
  </div>

  <!-- ══ BANNER FECHA LÍMITE ══════════════════════════════════════════ -->
  <div class="deadline-banner mb-3"
       [class.urgent]="data.fecha_limite?.urgente"
       [class.vencida]="data.fecha_limite?.vencida">
    <div class="deadline-left">
      <i class="bi" [class.bi-exclamation-triangle-fill]="data.fecha_limite?.urgente || data.fecha_limite?.vencida"
                    [class.bi-calendar-check-fill]="!data.fecha_limite?.urgente && !data.fecha_limite?.vencida"></i>
      <div>
        <span class="deadline-main">
          {{ data.fecha_limite?.vencida ? 'Declaración vencida —' : 'Recuerda subir tu declaración hasta el' }}
          <strong>{{ data.fecha_limite?.fecha_limite }}</strong>
        </span>
        <span class="deadline-sub" *ngIf="!data.fecha_limite?.vencida && (data.fecha_limite?.dias_restantes ?? 99) >= 0">
          quedan <strong>{{ data.fecha_limite?.dias_restantes }}</strong> día(s)
        </span>
      </div>
    </div>
    <app-info-tooltip [text]="tooltipRuc" label="Fecha límite SRI"></app-info-tooltip>
  </div>

  <!-- ══ NOTA FORMULARIO EN CERO ════════════════════════════════════ -->
  <div class="info-banner mb-4" *ngIf="esPeriodoEnCero">
    <i class="bi bi-info-circle-fill me-2"></i>
    <span>Sin ventas ni compras en el período. La normativa 2026 exige presentar el Formulario 104
    <strong>en cero</strong> dentro del plazo para evitar multas por falta de presentación.</span>
  </div>

  <!-- ══ ALERTA NC > VENTAS ═════════════════════════════════════════ -->
  <div class="alert-banner mb-3" *ngIf="data.bloque_400?.alertas?.nc_supera_ventas">
    <i class="bi bi-exclamation-triangle-fill me-2"></i>
    <strong>Advertencia:</strong>&nbsp;Las notas de crédito emitidas (casillero 402) superan las ventas del período (casillero 401). Verifique con su contador antes de declarar.
  </div>

  <!-- ══ KPIs SUPERIORES ═══════════════════════════════════════════ -->
  <div class="kpi-grid mb-4">

    <div class="kpi-card red">
      <span class="kpi-label">IVA a pagar SRI</span>
      <span class="kpi-value not-impl" *ngIf="data.kpis?.iva_a_pagar?.valor === null">—</span>
      <span class="kpi-value" *ngIf="data.kpis?.iva_a_pagar?.valor !== null">{{ data.kpis.iva_a_pagar.valor | currency }}</span>
      <span class="kpi-sub">{{ data.kpis?.iva_a_pagar?.sublabel }}</span>
    </div>

    <div class="kpi-card teal">
      <span class="kpi-label">Crédito tributario</span>
      <span class="kpi-value not-impl" *ngIf="data.kpis?.credito_tributario?.valor === null">—</span>
      <span class="kpi-value" *ngIf="data.kpis?.credito_tributario?.valor !== null">{{ data.kpis.credito_tributario.valor | currency }}</span>
      <span class="kpi-sub">{{ data.kpis?.credito_tributario?.sublabel }}</span>
    </div>

    <div class="kpi-card blue">
      <span class="kpi-label">{{ data.kpis?.ventas_tarifa_principal?.label || 'Ventas tarifa principal' }}</span>
      <span class="kpi-value" *ngIf="(data.kpis?.ventas_tarifa_principal?.valor ?? 0) > 0">
        {{ data.kpis.ventas_tarifa_principal.valor | currency }}
      </span>
      <span class="kpi-value not-impl" *ngIf="(data.kpis?.ventas_tarifa_principal?.valor ?? 0) === 0">$0.00</span>
      <span class="kpi-sub">{{ data.kpis?.ventas_tarifa_principal?.sublabel || 'base imponible' }}</span>
    </div>

    <div class="kpi-card amber">
      <span class="kpi-label">Retenciones recibidas</span>
      <span class="kpi-value not-impl">No disponible</span>
      <span class="kpi-sub">sin tabla en BD</span>
    </div>

    <div class="kpi-card indigo">
      <span class="kpi-label">Factor de este mes</span>
      <span class="kpi-value not-impl">—</span>
      <span class="kpi-sub">sin datos suficientes</span>
    </div>

  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- BLOQUE 400 — VENTAS                                           -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header ventas">
      <span class="bloque-badge">Sección 400</span>
      <h5><i class="bi bi-receipt me-2"></i>Resumen de Ventas</h5>
      <p>Facturas emitidas y autorizadas en el período — clasificadas por tarifa SRI</p>
    </div>
    <div class="table-responsive">
      <table class="table f104-table">
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

          <!-- 405/415: Ventas 0% CON derecho a crédito (RIMPE / exportación) -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Ventas locales tarifa 0% con derecho a crédito tributario (RIMPE / exportación)</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">405 / 415</span></td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 403/413: Ventas 0% -->
          <tr class="hover-row">
            <td class="desc-cell">
              <span class="desc-title">Ventas locales tarifa 0%</span>
              <span class="desc-sub">Líneas con tarifa 0% en facturas emitidas autorizadas</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">403 / 413</span></td>
            <td class="text-end font-mono">{{ data.bloque_400?.c403 | currency }}</td>
            <td class="text-end fw-bold">{{ data.bloque_400?.c403 | currency }}</td>
            <td class="text-end nd">$0.00</td>
          </tr>

          <!-- 401/411: Ventas gravadas tarifa > 0% -->
          <tr class="hover-row">
            <td class="desc-cell">
              <span class="desc-title">Ventas locales gravadas tarifa diferente de cero (15% / 8% / 5%)</span>
              <span class="desc-sub">Base imponible neta (bruto menos notas de crédito emitidas en el período)</span>
            </td>
            <td class="text-center"><span class="cas-badge azul">401 / 411</span></td>
            <td class="text-end font-mono">{{ data.bloque_400?.c401_bruto | currency }}</td>
            <td class="text-end fw-bold">{{ data.bloque_400?.c401_neto | currency }}</td>
            <td class="text-end iva-val">{{ data.bloque_400?.c411_neto | currency }}</td>
          </tr>

          <!-- 407/408/417/418: Exportaciones -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Exportaciones de Bienes (407) / Exportaciones de Servicios (408)</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">407 / 417<br>408 / 418</span></td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 431: Transferencias no objeto -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Transferencias no objeto o exentas de IVA</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">431</span></td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 402/412: Notas de crédito emitidas -->
          <tr class="hover-row nc-row">
            <td class="desc-cell">
              <span class="desc-title">(-) Notas de crédito emitidas tarifa diferente de cero</span>
              <span class="desc-sub">Se reportan en el mes de emisión de la NC, no en el de la factura original</span>
            </td>
            <td class="text-center"><span class="cas-badge rojo">402 / 412</span></td>
            <td class="text-end font-mono text-danger">{{ data.bloque_400?.c402 | currency }}</td>
            <td class="text-end fw-bold text-danger">{{ data.bloque_400?.c402 | currency }}</td>
            <td class="text-end text-danger">{{ data.bloque_400?.c412 | currency }}</td>
          </tr>

          <!-- 499: TOTAL IVA ventas -->
          <tr class="total-row">
            <td class="desc-cell">
              <span class="desc-title fw-bold">TOTAL IVA GENERADO EN VENTAS</span>
              <span class="desc-sub">411 + 415 + 416 + 417 + 418 − 412</span>
            </td>
            <td class="text-center"><span class="cas-badge verde">499</span></td>
            <td class="text-end">—</td>
            <td class="text-end">—</td>
            <td class="text-end fw-bold total-val">{{ data.bloque_400?.c499 | currency }}</td>
          </tr>

        </tbody>
      </table>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- BLOQUE 500 — COMPRAS / ADQUISICIONES                          -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header compras">
      <span class="bloque-badge">Sección 500</span>
      <h5><i class="bi bi-bag-check me-2"></i>Resumen de Adquisiciones y Pagos</h5>
      <p>Compras registradas en el módulo de Gastos.</p>
    </div>
    <div class="table-responsive">
      <table class="table f104-table">
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

          <!-- 507: Compras tarifa 0% / RIMPE -->
          <tr class="hover-row">
            <td class="desc-cell">
              <span class="desc-title">Adquisiciones y pagos tarifa 0% / RIMPE (negocios populares)</span>
              <span class="desc-sub">Gastos registrados sin IVA en el módulo de Gastos</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">507</span></td>
            <td class="text-end font-mono">{{ data.bloque_500?.c507 | currency }}</td>
            <td class="text-end fw-bold">{{ data.bloque_500?.c507 | currency }}</td>
            <td class="text-end nd">$0.00</td>
          </tr>

          <!-- 500/510: Compras gravadas con derecho a crédito -->
          <tr class="hover-row">
            <td class="desc-cell">
              <span class="desc-title">Adquisiciones gravadas tarifa diferente de cero — con derecho a crédito tributario</span>
              <span class="desc-sub">Gastos con IVA &gt; 0% del módulo de Gastos (excluyendo activos fijos)</span>
            </td>
            <td class="text-center"><span class="cas-badge azul">500 / 510</span></td>
            <td class="text-end font-mono">{{ data.bloque_500?.c500 | currency }}</td>
            <td class="text-end fw-bold">{{ data.bloque_500?.c500 | currency }}</td>
            <td class="text-end iva-val">{{ data.bloque_500?.c510 | currency }}</td>
          </tr>

          <!-- 509/519: Compras gravadas SIN derecho a crédito -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Adquisiciones gravadas tarifa diferente de cero — sin derecho a crédito tributario</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">509 / 519</span></td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 503/504: Compras en el exterior -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Compras en el exterior (ej. publicidad Facebook / Google Ads)</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">503 / 504</span></td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 520/521: NC en adquisiciones -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">(-) Notas de crédito en adquisiciones</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">520 / 521</span></td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 563: Factor de proporcionalidad -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Factor de proporcionalidad</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">563</span></td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 564: Crédito tributario aplicable -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Crédito tributario aplicable</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">564</span></td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 599: Total IVA pagado compras -->
          <tr class="total-row">
            <td class="desc-cell">
              <span class="desc-title fw-bold">TOTAL IVA PAGADO EN COMPRAS</span>
              <span class="desc-sub">Sumatoria de todo el IVA pagado en adquisiciones</span>
            </td>
            <td class="text-center"><span class="cas-badge verde">599</span></td>
            <td class="text-end">—</td>
            <td class="text-end">—</td>
            <td class="text-end fw-bold total-val">{{ data.bloque_500?.c599 | currency }}</td>
          </tr>

        </tbody>
      </table>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- BLOQUE 600 — RESUMEN IMPOSITIVO / LIQUIDACIÓN                 -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header liquidacion">
      <span class="bloque-badge">Sección 600</span>
      <h5><i class="bi bi-calculator me-2"></i>Resumen Impositivo — Liquidación</h5>
      <p>Resultado neto: IVA ventas vs crédito tributario de compras. Determina si hay pago o saldo a favor.</p>
    </div>
    <div class="table-responsive">
      <table class="table f104-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th class="text-center">Casillero</th>
            <th class="text-end">Valor</th>
          </tr>
        </thead>
        <tbody>

          <!-- 601: Impuesto causado -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Impuesto causado (499 − 564)</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">601</span></td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 602: Crédito tributario del período -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Crédito tributario para el próximo mes (564 − 499)</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">602</span></td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 605: Arrastre adquisiciones mes anterior -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Arrastre de crédito tributario por adquisiciones (mes anterior)</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">605</span></td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 606: Arrastre retenciones mes anterior -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Arrastre de crédito tributario por retenciones en la fuente (mes anterior)</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">606</span></td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 609: Retenciones recibidas en el período -->
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Retenciones en la fuente de IVA recibidas en el período</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">609</span></td>
            <td class="text-end nd">—</td>
          </tr>

          <!-- 699: Total impuesto a pagar -->
          <tr class="total-row">
            <td class="desc-cell">
              <span class="desc-title fw-bold">TOTAL IMPUESTO A PAGAR</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">699</span></td>
            <td class="text-end nd">—</td>
          </tr>

        </tbody>
      </table>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- BLOQUE 700 — AGENTES DE RETENCIÓN                             -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header retenciones">
      <span class="bloque-badge">Sección 700</span>
      <h5><i class="bi bi-percent me-2"></i>Agentes de Retención</h5>
      <p>Retenciones de IVA efectuadas a proveedores. Este valor se paga íntegro al SRI, sin compensación con crédito tributario.</p>
    </div>
    <div class="table-responsive">
      <table class="table f104-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th class="text-center">Casillero</th>
            <th class="text-end">%</th>
            <th class="text-end">Valor Bruto</th>
            <th class="text-end">Valor Neto</th>
            <th class="text-end">Impuesto generado</th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Retención 10% — servicios profesionales / arrendamiento</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">721</span></td>
            <td class="text-end nd">10%</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Retención 20% — otros servicios</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">723</span></td>
            <td class="text-end nd">20%</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Retención 30% — bienes muebles</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">725</span></td>
            <td class="text-end nd">30%</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Retención 70% — servicios / comisiones</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">727</span></td>
            <td class="text-end nd">70%</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Retención 100% — publicidad, pagos al exterior, Negocio Popular</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">729</span></td>
            <td class="text-end nd">100%</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
            <td class="text-end nd">—</td>
          </tr>
          <tr class="total-row">
            <td class="desc-cell">
              <span class="desc-title fw-bold">TOTAL RETENCIONES A PAGAR AL SRI (721 + 723 + 725 + 727 + 729)</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">799</span></td>
            <td class="text-end">—</td>
            <td class="text-end">—</td>
            <td class="text-end">—</td>
            <td class="text-end fw-bold total-val nd">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- BLOQUE 800/900 — TOTAL A PAGAR                                -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div class="bloque-card mb-4">
    <div class="bloque-header total-pago">
      <span class="bloque-badge">Sección 800 / 900</span>
      <h5><i class="bi bi-cash-stack me-2"></i>Totales y Pago</h5>
      <p>Suma final que aparecerá en el comprobante de pago al SRI</p>
    </div>
    <div class="table-responsive">
      <table class="table f104-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th class="text-center">Casillero</th>
            <th class="text-end">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Impuesto a pagar por percepción (viene del 699)</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">801</span></td>
            <td class="text-end nd">—</td>
          </tr>
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Impuesto a pagar por retención (viene del 799)</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">802</span></td>
            <td class="text-end nd">—</td>
          </tr>
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Interés por mora</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">897</span></td>
            <td class="text-end nd">—</td>
          </tr>
          <tr class="hover-row not-impl-row">
            <td class="desc-cell">
              <span class="desc-title">Multas</span>
              <span class="desc-sub impl-note">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge gris">898</span></td>
            <td class="text-end nd">—</td>
          </tr>
          <tr class="total-row grand-total">
            <td class="desc-cell">
              <span class="desc-title fw-bold">TOTAL PAGADO AL SRI (801 + 802 + 897 + 898)</span>
              <span class="desc-sub" style="color:#94a3b8">Sin información disponible</span>
            </td>
            <td class="text-center"><span class="cas-badge-grand" style="background:#475569">999</span></td>
            <td class="text-end grand-total-val" style="color:#94a3b8">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- CALENDARIZACIÓN SRI                                           -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div class="bloque-card mb-2">
    <div class="bloque-header calendario">
      <span class="bloque-badge">Referencia</span>
      <h5><i class="bi bi-calendar3 me-2"></i>Calendarización SRI — Fechas Límite de Declaración</h5>
      <p>
        RUC: <strong>{{ data.empresa?.ruc || '—' }}</strong> —
        Noveno dígito: <strong>{{ data.fecha_limite?.noveno_digito || '?' }}</strong> —
        Fecha límite: <strong>{{ data.fecha_limite?.fecha_limite || '—' }}</strong>
      </p>
    </div>
    <div class="cal-grid">
      <div class="cal-item" *ngFor="let c of calendario"
           [class.active]="c.digito === data.fecha_limite?.noveno_digito">
        <span class="cal-digito">{{ c.digito }}</span>
        <span class="cal-dia">Día {{ c.dia }}</span>
      </div>
    </div>
    <p class="cal-nota">Si el día cae en feriado o fin de semana, se traslada al siguiente día hábil.</p>
  </div>

</div>
  `,
  styles: [`
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* ── ENCABEZADO ── */
    .page-header { background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 1.5rem 1.75rem; }
    .page-title  { font-weight: 900; color: #0f172a; font-size: 1.15rem; margin-bottom: 0.25rem; }
    .page-sub    { font-size: 0.82rem; color: #64748b; margin-bottom: 0.75rem; }
    .header-meta-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .meta-badge  {
      display: inline-flex; align-items: center; font-size: 0.75rem; font-weight: 700;
      padding: 0.3rem 0.75rem; border-radius: 8px;
      background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
    }
    .meta-badge.rimpe { background: #fdf4ff; color: #7e22ce; border-color: #e9d5ff; }

    /* ── BANNERS ── */
    .deadline-banner {
      display: flex; align-items: center; justify-content: space-between;
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px;
      padding: 0.85rem 1.25rem; color: #166534; gap: 1rem;
    }
    .deadline-banner.urgent  { background: #fffbeb; border-color: #fde68a; color: #854d0e; }
    .deadline-banner.vencida { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .deadline-left { display: flex; align-items: center; gap: 0.75rem; font-size: 0.88rem; }
    .deadline-left > i { font-size: 1.25rem; flex-shrink: 0; }
    .deadline-main { display: block; font-weight: 600; }
    .deadline-sub  { display: block; font-size: 0.76rem; opacity: 0.8; }

    .info-banner {
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px;
      padding: 0.85rem 1.25rem; font-size: 0.85rem; color: #1e40af;
      display: flex; align-items: flex-start; gap: 0.4rem;
    }
    .alert-banner {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px;
      padding: 0.75rem 1.25rem; font-size: 0.85rem; color: #991b1b;
      display: flex; align-items: flex-start; gap: 0.4rem;
    }
    .nota-inline {
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
      padding: 0.55rem 1rem; font-size: 0.78rem; color: #854d0e; margin: 0 1.75rem;
    }

    /* ── KPIs ── */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1.1rem; }
    .kpi-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 20px;
      padding: 1.25rem 1.4rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      display: flex; flex-direction: column; gap: 0.25rem;
    }
    .kpi-card.red    { border-top: 4px solid #ef4444; }
    .kpi-card.teal   { border-top: 4px solid #14b8a6; }
    .kpi-card.blue   { border-top: 4px solid #3b82f6; }
    .kpi-card.amber  { border-top: 4px solid #f59e0b; }
    .kpi-card.indigo { border-top: 4px solid #6366f1; }
    .kpi-label { font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; }
    .kpi-value { font-size: 1.55rem; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .kpi-value.not-impl { font-size: 0.82rem; color: #94a3b8; font-style: italic; font-weight: 500; }
    .kpi-sub   { font-size: 0.7rem; color: #94a3b8; }

    /* ── BLOQUES ── */
    .bloque-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04); overflow: hidden;
    }
    .bloque-header { padding: 1.1rem 1.75rem 0.75rem; border-bottom: 1px solid #f1f5f9; }
    .bloque-header h5 { font-weight: 800; color: #1e293b; margin-bottom: 0.15rem; font-size: 0.98rem; }
    .bloque-header p  { font-size: 0.77rem; color: #64748b; margin: 0; }
    .bloque-badge {
      display: inline-block; font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em;
      text-transform: uppercase; padding: 0.18rem 0.55rem; border-radius: 6px;
      background: #f1f5f9; color: #475569; margin-bottom: 0.35rem;
    }
    .bloque-header.ventas      { border-left: 4px solid #3b82f6; }
    .bloque-header.compras     { border-left: 4px solid #14b8a6; }
    .bloque-header.liquidacion { border-left: 4px solid #f59e0b; }
    .bloque-header.retenciones { border-left: 4px solid #8b5cf6; }
    .bloque-header.total-pago  { border-left: 4px solid #ef4444; }
    .bloque-header.calendario  { border-left: 4px solid #6366f1; }

    /* ── TABLA ── */
    .f104-table thead th {
      background: #f8fafc; border: none; font-size: 0.66rem;
      text-transform: uppercase; color: #64748b; padding: 0.7rem 1rem; font-weight: 700;
    }
    .f104-table tbody td {
      border-bottom: 1px solid #f1f5f9; padding: 0.75rem 1rem;
      vertical-align: middle; font-size: 0.85rem;
    }
    .hover-row:hover { background: #f8fafc; }
    .not-impl-row td { opacity: 0.6; }
    .nc-row td       { background: #fff5f5 !important; }
    .nc-row:hover td { background: #fef2f2 !important; }
    .factor-row      { background: #faf5ff; }

    .desc-cell   { max-width: 380px; }
    .desc-title  { display: block; font-weight: 600; color: #334155; font-size: 0.85rem; }
    .desc-sub    { display: block; font-size: 0.73rem; color: #94a3b8; margin-top: 2px; }
    .impl-note   { color: #b45309 !important; }

    /* Casillero badges */
    .cas-badge {
      display: inline-block; padding: 0.22rem 0.5rem; border-radius: 7px;
      font-size: 0.7rem; font-weight: 800; font-family: monospace; letter-spacing: 0.2px;
    }
    .cas-badge.azul   { background: #eff6ff; color: #1d4ed8; }
    .cas-badge.verde  { background: #f0fdf4; color: #166534; }
    .cas-badge.rojo   { background: #fef2f2; color: #991b1b; }
    .cas-badge.gris   { background: #f1f5f9; color: #475569; }
    .cas-badge.indigo { background: #eef2ff; color: #4338ca; }

    .font-mono { font-family: monospace; font-size: 0.83rem; }
    .nd        { color: #94a3b8 !important; font-style: italic; }
    .iva-val   { font-weight: 700; color: #1d4ed8; }

    /* Filas totales */
    .total-row td     { background: #f8fafc; border-top: 2px solid #e2e8f0 !important; }
    .total-val        { font-size: 0.98rem; font-weight: 800; color: #1e293b; }
    .highlight-pay td { background: #fff7ed; }
    .highlight-credit td { background: #f0fdf4; }

    /* Grand total */
    .grand-total td        { background: #0f172a !important; }
    .grand-total .desc-title { color: #f8fafc !important; }
    .grand-total-val       { font-size: 1.15rem; font-weight: 900; color: #22c55e !important; }
    .cas-badge-grand {
      display: inline-block; padding: 0.22rem 0.5rem; border-radius: 7px;
      font-size: 0.7rem; font-weight: 800; font-family: monospace;
      background: #22c55e; color: #fff;
    }

    /* ── CALENDARIZACIÓN ── */
    .cal-grid {
      display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 1rem 1.75rem 0.5rem;
    }
    .cal-item {
      display: flex; flex-direction: column; align-items: center;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 0.55rem 0.9rem; min-width: 62px;
    }
    .cal-item.active { background: #1e293b; border-color: #1e293b; }
    .cal-item.active .cal-digito,
    .cal-item.active .cal-dia { color: #fff !important; }
    .cal-digito { font-size: 1.15rem; font-weight: 900; color: #1e293b; line-height: 1.2; }
    .cal-dia    { font-size: 0.62rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .cal-nota   { font-size: 0.74rem; color: #94a3b8; padding: 0 1.75rem 1rem; margin: 0; }
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

  get anioFiscal(): number {
    return this.data?.periodo?.inicio
      ? new Date(this.data.periodo.inicio + 'T00:00:00').getFullYear()
      : new Date().getFullYear();
  }

  get periodoTexto(): string {
    if (!this.data?.periodo?.inicio) return '—';
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const d1 = new Date(this.data.periodo.inicio + 'T00:00:00');
    const d2 = new Date(this.data.periodo.fin + 'T00:00:00');
    if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
      return meses[d1.getMonth()] + ' ' + d1.getFullYear();
    }
    return `${this.data.periodo.inicio} al ${this.data.periodo.fin}`;
  }

  get tooltipRuc(): string {
    const ruc     = this.data?.empresa?.ruc || '—';
    const noveno  = this.data?.fecha_limite?.noveno_digito || '?';
    const regimen = this.data?.empresa?.regimen === 'rimpe' ? 'semestral (RIMPE)' : 'mensual (Régimen General)';
    const fecha   = this.data?.fecha_limite?.fecha_limite || '—';
    return `Tu número de RUC: ${ruc} y el noveno dígito es ${noveno}, por lo que tu declaración ${regimen} tiene fecha máxima ${fecha}. Si el día cae feriado, se traslada al siguiente día hábil.`;
  }

  ngOnChanges() {}
}
