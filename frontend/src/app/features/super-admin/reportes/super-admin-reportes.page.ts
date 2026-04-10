import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  ReportesService, ReporteGlobal, ReporteComisiones, ReporteUso,
  EmpresaZonaRescate, EmpresaZonaUpgrade
} from './services/reportes.service';
import { VendedorService, Vendedor } from '../vendedores/services/vendedor.service';
import { UiService } from '../../../shared/services/ui.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

type Tab = 'global' | 'comisiones' | 'uso';
type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'mes_especifico' | 'anio_especifico' | 'personalizado';

@Component({
  selector: 'app-super-admin-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  template: `
<div class="reportes-wrap animate__animated animate__fadeIn">

  <!-- TABS -->
  <div class="tabs-bar mb-4">
    <button class="tab-btn" [class.active]="tabActivo === 'global'" (click)="setTab('global')">
      <i class="bi bi-globe2 me-2"></i>Reporte Global
    </button>
    <button class="tab-btn" [class.active]="tabActivo === 'comisiones'" (click)="setTab('comisiones')">
      <i class="bi bi-cash-coin me-2"></i>Comisiones
    </button>
    <button class="tab-btn" [class.active]="tabActivo === 'uso'" (click)="setTab('uso')">
      <i class="bi bi-bar-chart-line me-2"></i>Uso por Empresa
    </button>
  </div>

  <!-- ===================== R-031: REPORTE GLOBAL ===================== -->
  <div *ngIf="tabActivo === 'global'">
    <div class="section-header mb-4">
      <div>
        <h5 class="section-title">R-031 — Reporte Global del Sistema</h5>
        <p class="section-sub">Vista consolidada de todas las empresas, ingresos y zonas críticas</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn-generar" (click)="generarGlobal()" [disabled]="loadingGlobal">
          <span *ngIf="loadingGlobal" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!loadingGlobal" class="bi bi-arrow-clockwise me-2"></i>
          {{ loadingGlobal ? 'Generando...' : 'Generar Reporte' }}
        </button>
        <button class="btn-pdf" (click)="exportarPDFDashboard('global')" [disabled]="!datosGlobal || loadingPDF">
          <span *ngIf="loadingPDF && tabActivo === 'global'" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!loadingPDF || tabActivo !== 'global'" class="bi bi-file-earmark-pdf me-2"></i>
          {{ loadingPDF && tabActivo === 'global' ? 'Generando PDF...' : 'Exportar PDF' }}
        </button>
      </div>
    </div>

    <!-- Filtros R-031 -->
    <div class="filtros-card mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label-sm">Rango</label>
          <select class="form-select form-select-sm" [(ngModel)]="rangoTipoG" (change)="onRangoChange('G')">
            <option value="mes_actual">Mes actual</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="anio_actual">Año actual</option>
            <option value="mes_especifico">Mes específico</option>
            <option value="anio_especifico">Año específico</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipoG === 'mes_especifico'">
          <label class="form-label-sm">Mes</label>
          <select class="form-select form-select-sm" [(ngModel)]="mesFiltroG" (change)="onRangoChange('G')">
            <option *ngFor="let m of meses; let i = index" [value]="i+1">{{ m }}</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipoG === 'mes_especifico' || rangoTipoG === 'anio_especifico'">
          <label class="form-label-sm">Año</label>
          <input type="number" class="form-control form-control-sm" [(ngModel)]="anioFiltroG" (change)="onRangoChange('G')" [min]="2020" [max]="anioActual">
        </div>
        <div class="col-md-2" *ngIf="rangoTipoG === 'personalizado'">
          <label class="form-label-sm">Desde</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaInicioG">
        </div>
        <div class="col-md-2" *ngIf="rangoTipoG === 'personalizado'">
          <label class="form-label-sm">Hasta</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaFinG">
        </div>
        <div class="col-auto">
          <span class="rango-preview">{{ fechaInicioG }} → {{ fechaFinG }}</span>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div class="empty-state" *ngIf="!datosGlobal && !loadingGlobal">
      <i class="bi bi-graph-up-arrow"></i>
      <p>Presiona <strong>Generar Reporte</strong> para cargar los datos</p>
    </div>
    <div class="loading-state" *ngIf="loadingGlobal">
      <div class="spinner-grow text-primary" role="status"></div>
      <p>Obteniendo datos del sistema...</p>
    </div>

    <div *ngIf="datosGlobal" id="print-global">
      <!-- KPIs -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <span class="kpi-label">Empresas activas</span>
          <span class="kpi-value">{{ datosGlobal.empresas_activas }}</span>
          <span class="kpi-sub text-success">+{{ datosGlobal.empresas_nuevas_mes }} este mes</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Ingresos del año</span>
          <span class="kpi-value">{{ datosGlobal.ingresos_anio | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="kpi-sub" [class.text-success]="datosGlobal.variacion_ingresos_anio >= 0" [class.text-danger]="datosGlobal.variacion_ingresos_anio < 0">
            {{ datosGlobal.variacion_ingresos_anio >= 0 ? '+' : '' }}{{ datosGlobal.variacion_ingresos_anio }}% vs anterior
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Ingresos del mes</span>
          <span class="kpi-value">{{ datosGlobal.ingresos_mes | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="kpi-sub" [class.text-success]="datosGlobal.variacion_ingresos_mes >= 0" [class.text-danger]="datosGlobal.variacion_ingresos_mes < 0">
            {{ datosGlobal.variacion_ingresos_mes >= 0 ? '+' : '' }}{{ datosGlobal.variacion_ingresos_mes }}% vs anterior
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Usuarios nuevos</span>
          <span class="kpi-value">{{ datosGlobal.usuarios_nuevos_mes }}</span>
          <span class="kpi-sub text-muted">este mes</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Crecimiento Neto</span>
          <span class="kpi-value" [class.text-success]="datosGlobal.crecimiento_neto >= 0" [class.text-danger]="datosGlobal.crecimiento_neto < 0">
            {{ datosGlobal.crecimiento_neto > 0 ? '+' : '' }}{{ datosGlobal.crecimiento_neto }}
          </span>
          <span class="kpi-sub text-muted">empresas (Neto)</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Tasa de crecimiento</span>
          <span class="kpi-value text-success">{{ datosGlobal.tasa_crecimiento }}%</span>
          <span class="kpi-sub text-muted">mensual</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Tasa de abandono</span>
          <span class="kpi-value text-danger">{{ datosGlobal.tasa_abandono }}%</span>
          <span class="kpi-sub text-muted">de usuarios</span>
        </div>
        <div class="kpi-card kpi-warning">
          <span class="kpi-label">Zona upgrade</span>
          <span class="kpi-value">{{ datosGlobal.zona_upgrade }}</span>
          <span class="kpi-sub text-warning">empresas</span>
        </div>
        <div class="kpi-card kpi-danger">
          <span class="kpi-label">Zona de rescate</span>
          <span class="kpi-value">{{ datosGlobal.zona_rescate }}</span>
          <span class="kpi-sub text-danger">empresas</span>
        </div>
      </div>

      <!-- Gráficas row -->
      <div class="row g-4 mb-4">
        <!-- Donut: rescate vs upgrade -->
        <div class="col-md-4">
          <div class="card-graf">
            <h6 class="graf-title">Zonas críticas</h6>
            <div class="donut-wrap">
              <div class="donut" [style.background]="donutGlobal()"></div>
              <div class="donut-legend">
                <span class="dot dot-danger"></span> Rescate ({{ datosGlobal.zona_rescate }})
                <span class="dot dot-warning ms-3"></span> Upgrade ({{ datosGlobal.zona_upgrade }})
              </div>
            </div>
          </div>
        </div>
        <!-- Barras: planes más vendidos -->
        <div class="col-md-4">
          <div class="card-graf">
            <h6 class="graf-title">Planes más vendidos</h6>
            <div class="bar-chart">
              <div *ngFor="let p of datosGlobal.planes_mas_vendidos" class="bar-row">
                <span class="bar-label">{{ p.plan }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-primary" [style.width.%]="barPct(p.ventas, maxPlanVentas)"></div>
                </div>
                <span class="bar-val">{{ p.ventas }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Barras: top vendedores -->
        <div class="col-md-4">
          <div class="card-graf">
            <h6 class="graf-title">Top vendedores</h6>
            <div class="bar-chart">
              <div *ngFor="let v of datosGlobal.top_vendedores | slice:0:5" class="bar-row">
                <span class="bar-label">{{ v.vendedor.split(' ')[0] }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-success" [style.width.%]="barPct(v.ingresos_generados, maxVendedorIngresos)"></div>
                </div>
                <span class="bar-val">{{ v.ingresos_generados | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla: Zona de Rescate -->
      <div class="card-tabla mb-4">
        <div class="tabla-header">
          <span><i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>Zona de Rescate ({{ datosGlobal.empresas_rescate.length }})</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plan vencido</th>
                <th>Últ. acceso</th>
                <th>Venció</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Deadline</th>
                <th class="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of datosGlobal.empresas_rescate">
                <td>
                  <span class="empresa-tooltip" [title]="tooltipRescate(e)">
                    {{ e.nombre_empresa }} <i class="bi bi-info-circle text-muted ms-1 small"></i>
                  </span>
                </td>
                <td><span class="badge-plan">{{ e.plan_nombre }}</span></td>
                <td class="text-muted small">{{ e.ultimo_acceso_fmt || formatAcceso(e.ultimo_acceso) }}</td>
                <td class="text-muted small">{{ formatFecha(e.fecha_vencimiento) }}</td>
                <td class="small">{{ e.email || '—' }}</td>
                <td class="small">{{ e.telefono || '—' }}</td>
                <td>
                  <span class="badge-deadline" [ngClass]="deadlineClass(e.deadline)">
                    {{ e.deadline_fmt || formatDeadline(e.deadline) }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="d-flex justify-content-center gap-1">
                    <button class="btn-accion btn-reactivar" (click)="reactivarEmpresa(e)" title="Reactivar Empresa">
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="btn-accion btn-eliminar" (click)="eliminarEmpresa(e)" title="Eliminar Empresa">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="datosGlobal.empresas_rescate.length === 0">
                <td colspan="7" class="text-center text-muted py-4">Sin empresas en zona de rescate</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabla: Zona de Upgrade -->
      <div class="card-tabla">
        <div class="tabla-header">
          <span><i class="bi bi-arrow-up-circle-fill text-warning me-2"></i>Zona de Upgrade ({{ datosGlobal.empresas_upgrade.length }})</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plan actual</th>
                <th>Facturas este mes</th>
                <th>Límite del plan</th>
                <th>% Uso</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of datosGlobal.empresas_upgrade">
                <td class="fw-medium">{{ e.nombre_empresa }}</td>
                <td><span class="badge-plan">{{ e.plan_nombre }}</span></td>
                <td>{{ e.facturas_mes }}</td>
                <td>{{ e.max_facturas_mes }}</td>
                <td>
                  <div class="progress-wrap">
                    <div class="progress-bar-custom" [style.width.%]="e.porcentaje_uso" [ngClass]="e.porcentaje_uso >= 95 ? 'bg-danger' : 'bg-warning'"></div>
                    <span class="progress-label">{{ e.porcentaje_uso }}%</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="datosGlobal.empresas_upgrade.length === 0">
                <td colspan="5" class="text-center text-muted py-4">Sin empresas en zona de upgrade</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- ===================== R-032: COMISIONES ===================== -->
  <div *ngIf="tabActivo === 'comisiones'">
    <div class="section-header mb-4">
      <div>
        <h5 class="section-title">R-032 — Comisiones por Vendedor</h5>
        <p class="section-sub">Control de comisiones generadas, estados de aprobación y pago</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn-generar" (click)="generarComisiones()" [disabled]="loadingComisiones">
          <span *ngIf="loadingComisiones" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!loadingComisiones" class="bi bi-arrow-clockwise me-2"></i>
          {{ loadingComisiones ? 'Generando...' : 'Generar Reporte' }}
        </button>
        <button class="btn-pdf" (click)="exportarPDFDashboard('comisiones')" [disabled]="!datosComisiones || loadingPDF">
          <span *ngIf="loadingPDF && tabActivo === 'comisiones'" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!loadingPDF || tabActivo !== 'comisiones'" class="bi bi-file-earmark-pdf me-2"></i>
          {{ loadingPDF && tabActivo === 'comisiones' ? 'Generando PDF...' : 'Exportar PDF' }}
        </button>
      </div>
    </div>

    <!-- Filtros comisiones -->
    <div class="filtros-card mb-4">
      <div class="row g-3 align-items-end">
        <!-- Rango de fechas -->
        <div class="col-md-3">
          <label class="form-label-sm">Rango</label>
          <select class="form-select form-select-sm" [(ngModel)]="rangoTipoC" (change)="onRangoChange('C')">
            <option value="mes_actual">Mes actual</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="anio_actual">Año actual</option>
            <option value="mes_especifico">Mes específico</option>
            <option value="anio_especifico">Año específico</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipoC === 'mes_especifico'">
          <label class="form-label-sm">Mes</label>
          <select class="form-select form-select-sm" [(ngModel)]="mesFiltroC" (change)="onRangoChange('C')">
            <option *ngFor="let m of meses; let i = index" [value]="i+1">{{ m }}</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipoC === 'mes_especifico' || rangoTipoC === 'anio_especifico'">
          <label class="form-label-sm">Año</label>
          <input type="number" class="form-control form-control-sm" [(ngModel)]="anioFiltroC" (change)="onRangoChange('C')" [min]="2020" [max]="anioActual">
        </div>
        <div class="col-md-2" *ngIf="rangoTipoC === 'personalizado'">
          <label class="form-label-sm">Desde</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaInicioC">
        </div>
        <div class="col-md-2" *ngIf="rangoTipoC === 'personalizado'">
          <label class="form-label-sm">Hasta</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaFinC">
        </div>
        <!-- Vendedor -->
        <div class="col-md-3">
          <label class="form-label-sm">Vendedor</label>
          <select class="form-select form-select-sm" [(ngModel)]="vendedorIdC">
            <option value="">Todos</option>
            <option *ngFor="let v of vendedores" [value]="v.id">{{ v.nombre }}</option>
          </select>
        </div>
        <!-- Estado -->
        <div class="col-md-2">
          <label class="form-label-sm">Estado</label>
          <select class="form-select form-select-sm" [(ngModel)]="estadoC">
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="APROBADA">Aprobada</option>
            <option value="PAGADA">Pagada</option>
          </select>
        </div>
      </div>
    </div>

    <div class="empty-state" *ngIf="!datosComisiones && !loadingComisiones">
      <i class="bi bi-cash-stack"></i>
      <p>Configura los filtros y presiona <strong>Generar Reporte</strong></p>
    </div>
    <div class="loading-state" *ngIf="loadingComisiones">
      <div class="spinner-grow text-primary" role="status"></div>
      <p>Calculando comisiones...</p>
    </div>

    <div *ngIf="datosComisiones" id="print-comisiones">
      <!-- KPIs -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card kpi-warning">
          <span class="kpi-label">Comisiones pendientes</span>
          <span class="kpi-value">{{ datosComisiones.kpis.comisiones_pendientes | currency:'USD':'symbol':'1.2-2' }}</span>
          <span class="kpi-sub text-warning">de aprobación</span>
        </div>
        <div class="kpi-card kpi-success">
          <span class="kpi-label">Pagadas este mes</span>
          <span class="kpi-value">{{ datosComisiones.kpis.pagadas_mes | currency:'USD':'symbol':'1.2-2' }}</span>
          <span class="kpi-sub text-success">ya procesadas</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Vendedores activos</span>
          <span class="kpi-value">{{ datosComisiones.kpis.vendedores_activos }}</span>
          <span class="kpi-sub text-muted">en el sistema</span>
        </div>
        <div class="kpi-card kpi-success">
          <span class="kpi-label">Upgrades concretados</span>
          <span class="kpi-value">{{ datosComisiones.kpis.porcentaje_upgrades ?? 0 }}%</span>
          <span class="kpi-sub text-success">de éxito</span>
        </div>
        <div class="kpi-card kpi-danger">
          <span class="kpi-label">Clientes perdidos</span>
          <span class="kpi-value">{{ datosComisiones.kpis.porcentaje_clientes_perdidos ?? 0 }}%</span>
          <span class="kpi-sub text-danger">en zona rescate</span>
        </div>
      </div>

      <!-- Gráficas -->
      <div class="row g-4 mb-4">
        <div class="col-md-6">
          <div class="card-graf">
            <h6 class="graf-title">Top vendedores por ingresos</h6>
            <div class="bar-chart">
              <div *ngFor="let v of datosComisiones.top_vendedores | slice:0:5" class="bar-row">
                <span class="bar-label">{{ v.vendedor.split(' ')[0] }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-primary" [style.width.%]="barPct(v.ingresos_generados, maxVendedorIngresosC)"></div>
                </div>
                <span class="bar-val">{{ v.ingresos_generados | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card-graf">
            <h6 class="graf-title">Planes más vendidos</h6>
            <div class="bar-chart">
              <div *ngFor="let p of datosComisiones.planes_mas_vendidos" class="bar-row">
                <span class="bar-label">{{ p.plan }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-success" [style.width.%]="barPct(p.ventas, maxPlanVentasC)"></div>
                </div>
                <span class="bar-val">{{ p.ventas }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla detalle -->
      <div class="card-tabla">
        <div class="tabla-header">
          <span><i class="bi bi-table me-2"></i>Detalle de comisiones ({{ datosComisiones.detalle.length }} registros)</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Empresa</th>
                <th>Tipo de venta</th>
                <th>Plan</th>
                <th class="text-end">Comisión</th>
                <th class="text-center">Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of datosComisiones.detalle">
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-sm">{{ c.vendedor.charAt(0) }}</div>
                    {{ c.vendedor }}
                  </div>
                </td>
                <td class="text-muted small">{{ c.empresa }}</td>
                <td><span class="badge-tipo" [ngClass]="tipoVentaClass(c.tipo_venta)">{{ c.tipo_venta }}</span></td>
                <td><span class="badge-plan">{{ c.plan }}</span></td>
                <td class="text-end fw-bold">{{ c.comision | currency }}</td>
                <td class="text-center">
                  <span class="badge-estado" [ngClass]="estadoComisionClass(c.estado)">{{ c.estado }}</span>
                </td>
                <td class="text-muted small">{{ c.fecha || '—' }}</td>
              </tr>
              <tr *ngIf="datosComisiones.detalle.length === 0">
                <td colspan="7" class="text-center text-muted py-4">Sin comisiones con los filtros seleccionados</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- ===================== R-033: USO POR EMPRESA ===================== -->
  <div *ngIf="tabActivo === 'uso'">
    <div class="section-header mb-4">
      <div>
        <h5 class="section-title">R-033 — Uso del Sistema por Empresa</h5>
        <p class="section-sub">Métricas de uso para detectar empresas cerca del límite de su plan</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn-generar" (click)="generarUso()" [disabled]="loadingUso">
          <span *ngIf="loadingUso" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!loadingUso" class="bi bi-arrow-clockwise me-2"></i>
          {{ loadingUso ? 'Generando...' : 'Generar Reporte' }}
        </button>
        <button class="btn-pdf" (click)="exportarPDFDashboard('uso')" [disabled]="!datosUso || loadingPDF">
          <span *ngIf="loadingPDF && tabActivo === 'uso'" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!loadingPDF || tabActivo !== 'uso'" class="bi bi-file-earmark-pdf me-2"></i>
          {{ loadingPDF && tabActivo === 'uso' ? 'Generando PDF...' : 'Exportar PDF' }}
        </button>
      </div>
    </div>

    <!-- Filtros R-033 -->
    <div class="filtros-card mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label-sm">Rango</label>
          <select class="form-select form-select-sm" [(ngModel)]="rangoTipoU" (change)="onRangoChange('U')">
            <option value="mes_actual">Mes actual</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="anio_actual">Año actual</option>
            <option value="mes_especifico">Mes específico</option>
            <option value="anio_especifico">Año específico</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipoU === 'mes_especifico'">
          <label class="form-label-sm">Mes</label>
          <select class="form-select form-select-sm" [(ngModel)]="mesFiltroU" (change)="onRangoChange('U')">
            <option *ngFor="let m of meses; let i = index" [value]="i+1">{{ m }}</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipoU === 'mes_especifico' || rangoTipoU === 'anio_especifico'">
          <label class="form-label-sm">Año</label>
          <input type="number" class="form-control form-control-sm" [(ngModel)]="anioFiltroU" (change)="onRangoChange('U')" [min]="2020" [max]="anioActual">
        </div>
        <div class="col-md-2" *ngIf="rangoTipoU === 'personalizado'">
          <label class="form-label-sm">Desde</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaInicioU">
        </div>
        <div class="col-md-2" *ngIf="rangoTipoU === 'personalizado'">
          <label class="form-label-sm">Hasta</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaFinU">
        </div>
        <div class="col-auto">
          <span class="rango-preview">{{ fechaInicioU }} → {{ fechaFinU }}</span>
        </div>
      </div>
    </div>

    <div class="empty-state" *ngIf="!datosUso && !loadingUso">
      <i class="bi bi-speedometer2"></i>
      <p>Presiona <strong>Generar Reporte</strong> para ver el uso del sistema</p>
    </div>
    <div class="loading-state" *ngIf="loadingUso">
      <div class="spinner-grow text-primary" role="status"></div>
      <p>Analizando uso del sistema...</p>
    </div>

    <div *ngIf="datosUso" id="print-uso">
      <!-- KPIs -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <span class="kpi-label">Promedio usuarios/empresa</span>
          <span class="kpi-value">{{ datosUso.promedio_usuarios ?? 0 }}</span>
          <span class="kpi-sub text-muted">usuarios por empresa</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Máx. usuarios en una empresa</span>
          <span class="kpi-value">{{ datosUso.max_usuarios ?? 0 }}</span>
          <span class="kpi-sub text-muted">usuarios</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Mín. usuarios en una empresa</span>
          <span class="kpi-value">{{ datosUso.min_usuarios ?? 0 }}</span>
          <span class="kpi-sub text-muted">usuarios</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Empresas activas analizadas</span>
          <span class="kpi-value">{{ datosUso.empresas.length }}</span>
          <span class="kpi-sub text-muted">en el sistema</span>
        </div>
      </div>

      <!-- Gráficas -->
      <div class="row g-4 mb-4">
        <div class="col-md-5">
          <div class="card-graf">
            <h6 class="graf-title">Módulos más usados</h6>
            <div class="donut-modulos-wrap">
              <div *ngFor="let m of datosUso.modulos_mas_usados" class="modulo-row">
                <span class="modulo-label">{{ m.modulo }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-primary" [style.width.%]="m.porcentaje"></div>
                </div>
                <span class="bar-val">{{ m.porcentaje }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card-graf">
            <h6 class="graf-title">Empresas con más usuarios</h6>
            <div class="bar-chart">
              <div *ngFor="let e of topEmpresasPorUsuarios | slice:0:6" class="bar-row">
                <span class="bar-label">{{ e.empresa | slice:0:14 }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-info" [style.width.%]="barPct(e.total_usuarios, maxUsuariosEmpresa)"></div>
                </div>
                <span class="bar-val">{{ e.total_usuarios }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card-tabla">
        <div class="tabla-header">
          <span><i class="bi bi-table me-2"></i>Uso por empresa — mes actual ({{ datosUso.empresas.length }} empresas)</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Empresa</th>
                <th class="text-center">Usuarios</th>
                <th class="text-center">Fact. mes</th>
                <th>% de uso</th>
                <th class="text-center">Módulos</th>
                <th>Último acceso</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of datosUso.empresas">
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-medium">{{ e.empresa }}</span>
                    <span class="text-muted small">{{ e.plan_nombre || 'Sin plan' }}</span>
                  </div>
                </td>
                <td class="text-center">{{ e.usuarios_activos }}<span class="text-muted">/{{ e.total_usuarios }}</span></td>
                <td class="text-center">{{ e.facturas_mes }}</td>
                <td>
                  <div class="progress-wrap">
                    <div class="progress-bar-custom"
                      [style.width.%]="e.porcentaje_uso"
                      [ngClass]="e.porcentaje_uso >= 80 ? (e.porcentaje_uso >= 95 ? 'bg-danger' : 'bg-warning') : 'bg-success'">
                    </div>
                    <span class="progress-label">{{ e.porcentaje_uso }}%</span>
                  </div>
                </td>
                <td class="text-center">
                  <span class="modulos-badge">{{ e.modulos_usados }}<span class="text-muted">/{{ e.modulos_total }}</span></span>
                </td>
                <td class="text-muted small">{{ formatAcceso(e.ultimo_acceso) }}</td>
              </tr>
              <tr *ngIf="datosUso.empresas.length === 0">
                <td colspan="6" class="text-center text-muted py-4">Sin datos disponibles</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

</div>
<app-toast></app-toast>
  `,
  styles: [`
    .reportes-wrap { padding: 0.5rem 0; }

    /* TABS */
    .tabs-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 1.25rem;
      font-weight: 600;
      font-size: 0.9rem;
      color: #64748b;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      border-radius: 0;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: #161d35; }
    .tab-btn.active { color: #161d35; border-bottom-color: #161d35; }

    /* SECTION HEADER */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .section-title { font-size: 1.1rem; font-weight: 800; color: #161d35; margin: 0; }
    .section-sub { color: #64748b; font-size: 0.875rem; margin: 0.25rem 0 0; }

    /* BOTONES */
    .btn-generar {
      display: inline-flex; align-items: center;
      background: #161d35; color: #fff;
      border: none; border-radius: 10px;
      padding: 0.6rem 1.25rem; font-weight: 700; font-size: 0.875rem;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-generar:hover:not(:disabled) { background: #232d4d; transform: translateY(-1px); }
    .btn-generar:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-pdf {
      display: inline-flex; align-items: center;
      background: #fff; color: #dc2626;
      border: 1.5px solid #fca5a5; border-radius: 10px;
      padding: 0.6rem 1.25rem; font-weight: 700; font-size: 0.875rem;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-pdf:hover:not(:disabled) { background: #fff1f1; }
    .btn-pdf:disabled { opacity: 0.4; cursor: not-allowed; }

    /* FILTROS */
    .filtros-card {
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 14px; padding: 1.25rem 1.5rem;
    }
    .form-label-sm { font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; display: block; margin-bottom: 0.35rem; }
    .form-select, .form-control { border-radius: 8px; border-color: #e2e8f0; font-size: 0.875rem; }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }
    .kpi-card {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      padding: 1.25rem 1rem;
      display: flex; flex-direction: column; gap: 0.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .kpi-card.kpi-warning { border-left: 3px solid #f59e0b; }
    .kpi-card.kpi-danger  { border-left: 3px solid #ef4444; }
    .kpi-card.kpi-success { border-left: 3px solid #22c55e; }
    .kpi-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
    .kpi-value { font-size: 1.6rem; font-weight: 850; color: #161d35; line-height: 1.1; }
    .kpi-sub   { font-size: 0.78rem; font-weight: 500; }

    /* GRÁFICAS */
    .card-graf {
      background: #fff; border: 1px solid #f1f5f9;
      border-radius: 14px; padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04); height: 100%;
    }
    .graf-title { font-size: 0.8rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 1rem; }

    /* Donut */
    .donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .donut { width: 120px; height: 120px; border-radius: 50%; }
    .donut-legend { font-size: 0.8rem; color: #475569; display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem; }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
    .dot-danger  { background: #ef4444; }
    .dot-warning { background: #f59e0b; }

    /* Bar chart */
    .bar-chart { display: flex; flex-direction: column; gap: 0.6rem; }
    .bar-row { display: flex; align-items: center; gap: 0.5rem; }
    .bar-label { font-size: 0.78rem; color: #475569; width: 70px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-track { flex: 1; background: #f1f5f9; border-radius: 4px; height: 10px; overflow: hidden; }
    .bar-fill   { height: 100%; border-radius: 4px; transition: width 0.5s ease; min-width: 4px; }
    .bar-val    { font-size: 0.75rem; font-weight: 700; color: #475569; min-width: 55px; }

    /* Módulos */
    .donut-modulos-wrap { display: flex; flex-direction: column; gap: 0.6rem; }
    .modulo-row { display: flex; align-items: center; gap: 0.5rem; }
    .modulo-label { font-size: 0.78rem; color: #475569; width: 90px; }

    /* TABLAS */
    .card-tabla {
      background: #fff; border: 1px solid #f1f5f9;
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .tabla-header {
      padding: 1rem 1.5rem;
      font-size: 0.875rem; font-weight: 700; color: #161d35;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .table thead th {
      font-size: 0.72rem; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.4px;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
      position: sticky; top: 0; z-index: 1;
    }
    .table tbody td { padding: 0.9rem 1rem; font-size: 0.875rem; }
    .table tbody tr:hover td { background: #fafbfc; }

    /* Badges */
    .badge-plan {
      background: #e0f2fe; color: #0369a1;
      padding: 0.3rem 0.7rem; border-radius: 20px;
      font-size: 0.75rem; font-weight: 700;
    }
    .badge-deadline { padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .deadline-ok      { background: #dcfce7; color: #166534; }
    .deadline-warning { background: #fef9c3; color: #854d0e; }
    .deadline-urgent  { background: #fee2e2; color: #991b1b; }
    .badge-tipo { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
    .tipo-nueva       { background: #dcfce7; color: #166534; }
    .tipo-renovacion  { background: #e0f2fe; color: #0369a1; }
    .tipo-upgrade     { background: #fef3c7; color: #92400e; }
    .badge-estado { padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
    .estado-pendiente { background: #fef9c3; color: #854d0e; }
    .estado-aprobada  { background: #e0f2fe; color: #0369a1; }
    .estado-pagada    { background: #dcfce7; color: #166534; }
    
    .btn-accion {
      width: 28px; height: 28px; border-radius: 6px; border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; transition: all 0.2s; cursor: pointer;
    }
    .btn-reactivar { background: #dcfce7; color: #166534; }
    .btn-reactivar:hover { background: #bbf7d0; transform: scale(1.1); }
    .btn-eliminar  { background: #fee2e2; color: #991b1b; }
    .btn-eliminar:hover  { background: #fecaca; transform: scale(1.1); }

    /* Progress */
    .progress-wrap { display: flex; align-items: center; gap: 0.5rem; }
    .progress-bar-custom { height: 8px; border-radius: 4px; min-width: 4px; transition: width 0.4s ease; }
    .progress-label { font-size: 0.75rem; font-weight: 700; color: #475569; min-width: 40px; }

    /* Misc */
    .avatar-sm { width: 28px; height: 28px; background: #e2e8f0; color: #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; flex-shrink: 0; }
    .empresa-tooltip { cursor: default; }
    .modulos-badge { font-weight: 700; }

    /* Rango preview */
    .rango-preview { font-size: 0.78rem; color: #64748b; background: #e2e8f0; padding: 0.35rem 0.75rem; border-radius: 20px; white-space: nowrap; }

    /* Empty / Loading */
    .empty-state { padding: 4rem 2rem; text-align: center; color: #94a3b8; }
    .empty-state i { font-size: 3.5rem; opacity: 0.2; display: block; margin-bottom: 1rem; }
    .empty-state p { margin: 0; font-size: 0.95rem; }
    .loading-state { padding: 4rem 2rem; text-align: center; color: #64748b; }
    .loading-state p { margin-top: 1rem; font-weight: 600; }

    /* PRINT */
    @media print {
      .tabs-bar, .section-header .btn-generar, .section-header .btn-pdf,
      .filtros-card, app-toast { display: none !important; }
      .reportes-wrap { padding: 0; }
      .kpi-grid { grid-template-columns: repeat(4, 1fr); }
      .card-graf, .card-tabla, .kpi-card { box-shadow: none !important; border: 1px solid #ddd !important; }
      .table thead th { background: #f0f0f0 !important; }
    }
  `]
})
export class SuperAdminReportesPage implements OnInit, OnDestroy {

  tabActivo: Tab = 'global';

  // R-031
  datosGlobal: ReporteGlobal | null = null;
  loadingGlobal = false;
  rangoTipoG: RangoTipo = 'mes_actual';
  fechaInicioG = '';
  fechaFinG = '';
  mesFiltroG = new Date().getMonth() + 1;
  anioFiltroG = new Date().getFullYear();

  // R-032
  datosComisiones: ReporteComisiones | null = null;
  loadingComisiones = false;
  rangoTipoC: RangoTipo = 'mes_actual';
  fechaInicioC = '';
  fechaFinC = '';
  mesFiltroC = new Date().getMonth() + 1;
  anioFiltroC = new Date().getFullYear();
  vendedorIdC = '';
  estadoC = '';

  // R-033
  datosUso: ReporteUso | null = null;
  loadingUso = false;
  rangoTipoU: RangoTipo = 'mes_actual';
  fechaInicioU = '';
  fechaFinU = '';
  mesFiltroU = new Date().getMonth() + 1;
  anioFiltroU = new Date().getFullYear();

  // PDF export loading
  loadingPDF = false;

  vendedores: Vendedor[] = [];
  anioActual = new Date().getFullYear();
  meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private vendedorService: VendedorService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.vendedorService.getVendedores()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.vendedores = data);
    this.onRangoChange('G');
    this.onRangoChange('C');
    this.onRangoChange('U');
    // Generar automáticamente todos los reportes al entrar
    this.generarGlobal();
    this.generarComisiones();
    this.generarUso();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: Tab) {
    this.tabActivo = tab;
    // Generar automáticamente reporte al cambiar de sección
    switch (tab) {
      case 'global':
        this.generarGlobal();
        break;
      case 'comisiones':
        this.generarComisiones();
        break;
      case 'uso':
        this.generarUso();
        break;
    }
  }

  // ---- R-031 ----
  generarGlobal() {
    this.loadingGlobal = true;
    this.reportesService.getReporteGlobal({ fecha_inicio: this.fechaInicioG, fecha_fin: this.fechaFinG })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.datosGlobal = data; this.loadingGlobal = false; this.cd.detectChanges(); },
        error: (err) => { this.loadingGlobal = false; this.uiService.showError(err, 'Error al cargar reporte global'); this.cd.detectChanges(); }
      });
  }

  // ---- R-032 ----
  generarComisiones() {
    this.loadingComisiones = true;
    const params: any = {};
    if (this.rangoTipoC !== 'mes_actual' && this.rangoTipoC !== 'anio_actual' && this.rangoTipoC !== 'mes_anterior') {
      params.fecha_inicio = this.fechaInicioC;
      params.fecha_fin = this.fechaFinC;
    } else {
      params.fecha_inicio = this.fechaInicioC;
      params.fecha_fin = this.fechaFinC;
    }
    if (this.vendedorIdC) params.vendedor_id = this.vendedorIdC;
    if (this.estadoC) params.estado = this.estadoC;

    this.reportesService.getReporteComisiones(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.datosComisiones = data; this.loadingComisiones = false; this.cd.detectChanges(); },
        error: (err) => { this.loadingComisiones = false; this.uiService.showError(err, 'Error al cargar comisiones'); this.cd.detectChanges(); }
      });
  }

  // ---- R-033 ----
  generarUso() {
    this.loadingUso = true;
    this.reportesService.getReporteUso({ fecha_inicio: this.fechaInicioU, fecha_fin: this.fechaFinU })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.datosUso = data; this.loadingUso = false; this.cd.detectChanges(); },
        error: (err) => { this.loadingUso = false; this.uiService.showError(err, 'Error al cargar uso del sistema'); this.cd.detectChanges(); }
      });
  }

  // ---- Rango de fechas ----
  onRangoChange(prefix: 'G' | 'C' | 'U') {
    const now = new Date();
    const rangoKey = `rangoTipo${prefix}` as 'rangoTipoG' | 'rangoTipoC' | 'rangoTipoU';
    const fiKey   = `fechaInicio${prefix}` as 'fechaInicioG' | 'fechaInicioC' | 'fechaInicioU';
    const ffKey   = `fechaFin${prefix}` as 'fechaFinG' | 'fechaFinC' | 'fechaFinU';
    const mesKey  = `mesFiltro${prefix}` as 'mesFiltroG' | 'mesFiltroC' | 'mesFiltroU';
    const anioKey = `anioFiltro${prefix}` as 'anioFiltroG' | 'anioFiltroC' | 'anioFiltroU';

    switch (this[rangoKey]) {
      case 'mes_actual':
        this[fiKey] = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        this[ffKey] = now.toISOString().split('T')[0];
        break;
      case 'mes_anterior': {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        this[fiKey] = prev.toISOString().split('T')[0];
        this[ffKey] = prevEnd.toISOString().split('T')[0];
        break;
      }
      case 'anio_actual':
        this[fiKey] = `${now.getFullYear()}-01-01`;
        this[ffKey] = now.toISOString().split('T')[0];
        break;
      case 'mes_especifico': {
        const y = this[anioKey], m = this[mesKey];
        this[fiKey] = `${y}-${String(m).padStart(2,'0')}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        this[ffKey] = `${y}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
        break;
      }
      case 'anio_especifico':
        this[fiKey] = `${this[anioKey]}-01-01`;
        this[ffKey] = `${this[anioKey]}-12-31`;
        break;
      case 'personalizado':
        break;
    }
  }

  // ---- Exportar PDF ----
  exportarPDFDashboard(seccion: Tab) {
    let tipo = '';
    let params: any = {};

    if (seccion === 'global') {
      tipo = 'SUPERADMIN_GLOBAL';
      params = {
        fecha_inicio: this.fechaInicioG,
        fecha_fin: this.fechaFinG
      };
    } else if (seccion === 'comisiones') {
      tipo = 'SUPERADMIN_COMISIONES';
      params = {
        fecha_inicio: this.fechaInicioC,
        fecha_fin: this.fechaFinC,
        vendedor_id: this.vendedorIdC,
        estado: this.estadoC
      };
    } else {
      tipo = 'SUPERADMIN_USO';
      params = {
        fecha_inicio: this.fechaInicioU,
        fecha_fin: this.fechaFinU
      };
    }

    this.loadingPDF = true;
    const titulo = seccion === 'global' ? 'Reporte Global'
                 : seccion === 'comisiones' ? 'Reporte de Comisiones'
                 : 'Reporte de Uso';
    this.uiService.showToast(`Generando ${titulo}...`, 'info', 'Esto puede tardar unos segundos', 8000);
    this.cd.detectChanges();

    this.reportesService.exportarPDF(tipo, params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${seccion}_${new Date().getTime()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.uiService.showToast('PDF generado exitosamente', 'success', 'El archivo ha sido descargado', 4000);
      },
      error: (err) => {
        console.error('Error exportando PDF:', err);
        this.uiService.showError(err, 'Error al generar PDF');
      }
    }).add(() => {
      this.loadingPDF = false;
      this.cd.detectChanges();
    });
  }

  // ---- Helpers gráficas ----
  get maxPlanVentas(): number {
    return Math.max(...(this.datosGlobal?.planes_mas_vendidos.map(p => p.ventas) ?? [1]));
  }
  get maxVendedorIngresos(): number {
    return Math.max(...(this.datosGlobal?.top_vendedores.map(v => v.ingresos_generados) ?? [1]));
  }
  get maxVendedorIngresosC(): number {
    return Math.max(...(this.datosComisiones?.top_vendedores.map(v => v.ingresos_generados) ?? [1]));
  }
  get maxPlanVentasC(): number {
    return Math.max(...(this.datosComisiones?.planes_mas_vendidos.map(p => p.ventas) ?? [1]));
  }
  get topEmpresasPorUsuarios() {
    return [...(this.datosUso?.empresas ?? [])].sort((a,b) => b.total_usuarios - a.total_usuarios);
  }
  get maxUsuariosEmpresa(): number {
    return Math.max(...(this.datosUso?.empresas.map(e => e.total_usuarios) ?? [1]));
  }

  barPct(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  donutGlobal(): string {
    if (!this.datosGlobal) return '#e2e8f0';
    const total = (this.datosGlobal.zona_rescate + this.datosGlobal.zona_upgrade) || 1;
    const pctRescate = Math.round((this.datosGlobal.zona_rescate / total) * 100);
    return `conic-gradient(#ef4444 0% ${pctRescate}%, #f59e0b ${pctRescate}% 100%)`;
  }

  // ---- Helpers formateo ----
  formatAcceso(fecha: string | null): string {
    if (!fecha) return 'Sin acceso';
    const d = new Date(fecha);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Hoy, ' + d.toLocaleTimeString('es-EC', {hour:'2-digit', minute:'2-digit'});
    if (diffDays === 1) return 'Ayer, ' + d.toLocaleTimeString('es-EC', {hour:'2-digit', minute:'2-digit'});
    if (diffDays < 30) return `Hace ${diffDays} días`;
    return d.toLocaleDateString('es-EC', {day:'2-digit',month:'short',year:'numeric'});
  }

  formatFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays > -1 && diffDays < 31) return `Hace ${Math.abs(diffDays)} días`;
    return d.toLocaleDateString('es-EC', {day:'2-digit',month:'short',year:'numeric'});
  }

  formatDeadline(deadline: string | null): string {
    if (!deadline) return '—';
    const d = new Date(deadline);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffH < 1) return '< 1 hora';
    if (diffH < 8) return `< ${diffH}h`;
    if (diffH < 24) return `< 24hs`;
    if (diffDays <= 2) return `${diffDays} días`;
    return `${diffDays} días`;
  }

  deadlineClass(deadline: string | null): string {
    if (!deadline) return '';
    const diffH = Math.floor((new Date(deadline).getTime() - Date.now()) / 3600000);
    if (diffH < 24) return 'deadline-urgent';
    if (diffH < 72) return 'deadline-warning';
    return 'deadline-ok';
  }

  tooltipRescate(e: EmpresaZonaRescate): string {
    return `Vendedor: ${e.vendedor_nombre || 'N/A'}\nAntigüedad: ${e.antiguedad || 'N/A'}\nRepresentante: ${e.representante || 'N/A'}`;
  }

  reactivarEmpresa(e: EmpresaZonaRescate) {
    this.uiService.showToast('Funcionalidad de Reactivación', 'info', `Iniciando proceso para ${e.nombre_empresa}`);
    // Aquí iría la lógica para llamar al servicio de suscripciones
  }

  eliminarEmpresa(e: EmpresaZonaRescate) {
    this.uiService.showToast('Funcionalidad de Eliminación', 'warning', `Confirmación pendiente para borrar ${e.nombre_empresa}`);
    // Aquí iría la lógica para llamar al servicio de empresas
  }

  tipoVentaClass(tipo: string): string {
    if (tipo === 'Nueva') return 'tipo-nueva';
    if (tipo === 'Upgrade') return 'tipo-upgrade';
    return 'tipo-renovacion';
  }

  estadoComisionClass(estado: string): string {
    if (estado === 'PENDIENTE') return 'estado-pendiente';
    if (estado === 'APROBADA') return 'estado-aprobada';
    if (estado === 'PAGADA') return 'estado-pagada';
    return '';
  }
}
