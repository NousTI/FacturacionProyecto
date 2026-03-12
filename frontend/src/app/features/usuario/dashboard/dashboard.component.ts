import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { UiService } from '../../../shared/services/ui.service';
import { DashboardService, DashboardOverview } from '../../../shared/services/dashboard.service';
import { InfoTooltipComponent } from '../../../shared/components/info-tooltip/info-tooltip.component';


@Component({
  selector: 'app-usuario-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, InfoTooltipComponent],
  providers: [CurrencyPipe, DecimalPipe],
  template: `
    <div class="dash-wrap p-4">
      
      <!-- Estado de Carga -->
      <div *ngIf="loading" class="d-flex justify-content-center align-items-center" style="height: 400px;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <ng-container *ngIf="!loading">
        <!-- ── FILA 1: KPIs ── -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <app-stat-card
              title="Facturas del Mes"
              [value]="(overview?.kpis?.ventas_periodo | currency:'USD':'symbol':'1.2-2') || '$0.00'"
              icon="bi-receipt"
              iconBg="rgba(99,102,241,.1)"
              iconColor="#6366f1">
              <app-info-tooltip message="Suma total de facturas autorizadas en el periodo actual."></app-info-tooltip>
            </app-stat-card>
          </div>
          <div class="col-6 col-lg-3">
            <app-stat-card
              title="Ventas de Hoy"
              [value]="(overview?.kpis?.ventas_hoy | currency:'USD':'symbol':'1.2-2') || '$0.00'"
              icon="bi-check-circle"
              iconBg="rgba(16,185,129,.1)"
              iconColor="#10b981">
              <app-info-tooltip message="Monto total de las ventas realizadas durante el día actual."></app-info-tooltip>
            </app-stat-card>
          </div>
          <div class="col-6 col-lg-3">
            <app-stat-card
              title="Saldos Pendientes"
              [value]="(overview?.kpis?.cuentas_cobrar | currency:'USD':'symbol':'1.2-2') || '$0.00'"
              icon="bi-hourglass-split"
              iconBg="rgba(245,158,11,.1)"
              iconColor="#f59e0b">
              <app-info-tooltip message="Total de facturas autorizadas que aún no han sido cobradas (estado de pago pendiente)."></app-info-tooltip>
            </app-stat-card>
          </div>
          <div class="col-6 col-lg-3">
            <app-stat-card
              title="Stock Bajo"
              [value]="overview?.kpis?.productos_stock_bajo?.toString() || '0'"
              icon="bi-box-seam"
              iconBg="rgba(14,165,233,.1)"
              iconColor="#0ea5e9">
              <app-info-tooltip message="Cantidad de productos activos cuyo stock actual es menor o igual al mínimo definido."></app-info-tooltip>
            </app-stat-card>
          </div>
        </div>

        <!-- ── FILA 2: Últimas facturas + Accesos rápidos ── -->
        <div class="row g-3 mb-4">

          <!-- Últimas Facturas -->
          <div class="col-lg-8">
            <div class="panel">
              <div class="panel-header">
                <span><i class="bi bi-receipt me-2"></i>Últimas Facturas</span>
                <a routerLink="/usuario/facturacion" class="panel-header-link">Ver todas</a>
              </div>
              <table class="table table-sm table-hover mb-0">
                <thead>
                  <tr>
                    <th>N° Factura</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th class="text-end">Fecha</th>
                  </tr>
                </thead>
                <tbody *ngIf="overview?.facturas_recientes?.length; else emptyFacturas">
                  <tr *ngFor="let f of overview?.facturas_recientes">
                    <td class="fw-bold small text-muted">{{ f.numero }}</td>
                    <td class="small text-truncate" style="max-width: 150px;">{{ f.cliente }}</td>
                    <td class="fw-bold small">{{ f.total | currency:'USD' }}</td>
                    <td>
                      <span class="estado-badge" [ngClass]="getEstadoClass(f.estado)">{{ f.estado }}</span>
                    </td>
                    <td class="text-end text-muted small">{{ f.fecha | date:'dd/MM' }}</td>
                  </tr>
                </tbody>
                <ng-template #emptyFacturas>
                  <tbody>
                    <tr>
                      <td colspan="5" class="text-center py-4 text-muted small">No se encontraron facturas recientes.</td>
                    </tr>
                  </tbody>
                </ng-template>
              </table>
              <div class="panel-footer text-center">
                <a routerLink="/usuario/facturacion" class="text-primary small fw-bold text-decoration-none">
                  Nueva factura <i class="bi bi-plus-circle ms-1"></i>
                </a>
              </div>
            </div>
          </div>

          <!-- ── Accesos Rápidos + Estado de Firma/Plan ── -->
          <div class="col-lg-4">
            <div class="d-flex flex-column gap-3">
              
              <!-- 1. Firma Electrónica -->
              <div class="panel p-3 border-start border-4" 
                   [ngClass]="(overview?.firma_info?.dias_restantes || 0) < 15 ? 'border-danger' : 'border-warning'">
                <div class="d-flex align-items-center gap-3">
                  <div class="ql-icon" 
                       [style.color]="(overview?.firma_info?.dias_restantes || 0) < 15 ? '#ef4444' : '#f59e0b'"
                       [style.background]="(overview?.firma_info?.dias_restantes || 0) < 15 ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)'">
                    <i class="bi bi-key-fill"></i>
                  </div>
                  <div *ngIf="overview?.firma_info; else noFirma">
                    <div class="small text-muted fw-bold" style="font-size: 0.65rem;">FIRMA ELECTRÓNICA</div>
                    <div class="fw-bold" style="font-size: 0.9rem;">
                      {{ (overview?.firma_info?.dias_restantes || 0) > 0 ? 'Expira en ' + overview?.firma_info?.dias_restantes + ' días' : 'Firma Expirada' }}
                    </div>
                    <div class="text-muted" style="font-size: 0.7rem;">Vencimiento: {{ overview?.firma_info?.fecha | date:'dd/MM/yyyy' }}</div>
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
              <div class="panel p-3" *ngIf="overview?.consumo_plan">
                <div class="d-flex justify-content-between mb-1">
                  <span class="small fw-bold text-muted" style="font-size: 0.65rem;">
                    CONSUMO DE PLAN
                    <app-info-tooltip message="Porcentaje de documentos emitidos respecto al límite mensual de tu plan contratado."></app-info-tooltip>
                  </span>
                  <span class="small fw-bold">{{ overview?.consumo_plan?.actual }} / {{ overview?.consumo_plan?.limite }}</span>
                </div>
                <div class="progress mb-1" style="height: 6px;">
                  <div class="progress-bar bg-success" 
                       [style.width.%]="((overview?.consumo_plan?.actual || 0) / (overview?.consumo_plan?.limite || 1)) * 100"></div>
                </div>
                <div class="text-muted" style="font-size: 0.65rem;">
                  {{ (overview?.consumo_plan?.limite || 0) - (overview?.consumo_plan?.actual || 0) }} documentos restantes
                </div>
              </div>

              <!-- Accesos Rápidos -->
              <div class="panel">
                <div class="panel-header">
                  <span><i class="bi bi-lightning-charge me-2"></i>Accesos Rápidos</span>
                </div>
                <div class="quick-links">
                  <a routerLink="/usuario/facturacion" class="quick-link">
                    <div class="ql-icon" style="color:#6366f1; background:rgba(99,102,241,.1)">
                      <i class="bi bi-plus-circle-fill"></i>
                    </div>
                    <span>Nueva Factura</span>
                    <i class="bi bi-chevron-right ms-auto text-muted"></i>
                  </a>
                  <a routerLink="/usuario/clientes" class="quick-link">
                    <div class="ql-icon" style="color:#0ea5e9; background:rgba(14,165,233,.1)">
                      <i class="bi bi-person-plus-fill"></i>
                    </div>
                    <span>Nuevo Cliente</span>
                    <i class="bi bi-chevron-right ms-auto text-muted"></i>
                  </a>
                  <a routerLink="/usuario/productos" class="quick-link">
                    <div class="ql-icon" style="color:#ec4899; background:rgba(236,72,153,.1)">
                      <i class="bi bi-box-seam-fill"></i>
                    </div>
                    <span>Productos</span>
                    <i class="bi bi-chevron-right ms-auto text-muted"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── FILA 3: Top Ventas ── -->
        <div class="row g-3 mb-4">
          <div class="col-12">
            <div class="panel">
              <div class="panel-header">
                <span>
                  <i class="bi bi-graph-up-arrow me-2"></i>Productos más vendidos
                  <app-info-tooltip message="Los 3 productos con mayor recaudación total (precio × cantidad) en el periodo seleccionado."></app-info-tooltip>
                </span>
              </div>
              <div class="p-3">
                <div class="row" *ngIf="overview?.top_productos?.length; else noProducts">
                  <div *ngFor="let p of overview?.top_productos" class="col-md-4 mb-3 mb-md-0">
                    <div class="d-flex justify-content-between mb-1">
                      <span class="small fw-bold text-truncate" style="max-width: 150px;">{{ p.nombre }}</span>
                      <span class="small fw-bold text-dark">{{ p.total | currency:'USD':'symbol':'1.2-2' }}</span>
                    </div>
                    <div class="progress" style="height: 4px;">
                      <div class="progress-bar bg-primary" 
                           [style.width.%]="((p.total || 0) / (overview?.top_productos?.[0]?.total || 1)) * 100"></div>
                    </div>
                    <div class="text-muted mt-1" style="font-size: 0.65rem;">{{ p.cantidad }} unidades vendidas</div>
                  </div>
                </div>
                <ng-template #noProducts>
                  <div class="text-center py-3 text-muted small">Aún no hay datos de ventas para este periodo.</div>
                </ng-template>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .dash-wrap { min-height: 100vh; padding-bottom: 2rem; }

    /* Panel genérico */
    .panel {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .panel-header {
      padding: 0.9rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 800;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .panel-header-link {
      font-size: 0.75rem;
      font-weight: 700;
      color: #6366f1;
      text-decoration: none;
    }
    .panel-footer {
      padding: 0.75rem;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
    }

    /* Tabla */
    .table thead th {
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      border-bottom: 1px solid #f1f5f9;
      padding: 0.6rem 1rem;
      background: white;
    }
    .table tbody td { padding: 0.7rem 1rem; vertical-align: middle; font-size: 0.875rem; }
    .table-hover tbody tr:hover td { background: #f8fafc; }

    /* Estado badges */
    .estado-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-autorizada { background: #ecfdf5; color: #10b981; }
    .badge-borrador   { background: #f1f5f9; color: #64748b; }
    .badge-anulada    { background: #fef2f2; color: #ef4444; }
    .badge-proceso    { background: #fff7ed; color: #f59e0b; }

    /* Accesos rápidos */
    .quick-links { display: flex; flex-direction: column; }
    .quick-link {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.85rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #334155;
      text-decoration: none;
      border-bottom: 1px solid #f8fafc;
      transition: background 0.15s;
    }
    .quick-link:hover { background: #f8fafc; color: #161d35; }
    .quick-link:last-child { border-bottom: none; }
    .ql-icon {
      width: 34px; height: 34px;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }
  `]
})
export class DashboardComponent implements OnInit {
  overview?: DashboardOverview;
  loading = true;

  constructor(
    private uiService: UiService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.uiService.setPageHeader('Dashboard', 'Resumen general de tu actividad');
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.dashboardService.getOverview('month').subscribe({
      next: (data) => {
        this.zone.run(() => {
          setTimeout(() => {
            this.overview = data;
            this.loading = false;
            this.cdr.markForCheck();
            this.cdr.detectChanges();
            console.log('[Dashboard] Vista actualizada con datos reales');
          }, 0);
        });
      },
      error: (err) => {
        console.error('[Dashboard] Error:', err);
        this.zone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  getEstadoClass(estado: string): string {
    const s = estado?.toUpperCase() || '';
    if (s.includes('AUTORIZADA')) return 'badge-autorizada';
    if (s.includes('BORRADOR')) return 'badge-borrador';
    if (s.includes('ANULADA') || s.includes('RECHAZADA')) return 'badge-anulada';
    if (s.includes('PROCESO') || s.includes('ENVIADO')) return 'badge-proceso';
    return 'badge-borrador';
  }
}
