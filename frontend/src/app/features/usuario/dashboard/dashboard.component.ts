import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { UiService } from '../../../shared/services/ui.service';
import { DashboardService, DashboardOverview } from '../../../shared/services/dashboard.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';


@Component({
  selector: 'app-usuario-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent],
  providers: [CurrencyPipe, DecimalPipe],

  template: `
    <div class="dash-wrap">

      <!-- ── FILA 1: KPIs ── -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Facturas del Mes"
            [value]="(overview?.kpis?.ventas_periodo | currency:'USD':'symbol':'1.2-2') || '$0.00'"
            icon="bi-receipt"
            iconBg="rgba(99,102,241,.1)"
            iconColor="#6366f1">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Ventas de Hoy"
            [value]="(overview?.kpis?.ventas_hoy | currency:'USD':'symbol':'1.2-2') || '$0.00'"
            icon="bi-check-circle"
            iconBg="rgba(16,185,129,.1)"
            iconColor="#10b981">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Saldos Pendientes"
            [value]="(overview?.kpis?.cuentas_cobrar | currency:'USD':'symbol':'1.2-2') || '$0.00'"
            icon="bi-hourglass-split"
            iconBg="rgba(245,158,11,.1)"
            iconColor="#f59e0b">
          </app-stat-card>
        </div>

        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Stock Bajo"
            [value]="overview?.kpis?.productos_stock_bajo?.toString() || '0'"
            icon="bi-box-seam"
            iconBg="rgba(14,165,233,.1)"
            iconColor="#0ea5e9">
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
              <tbody>
                <tr *ngFor="let f of mockFacturas">
                  <td class="fw-bold small text-muted">{{ f.numero }}</td>
                  <td class="small">{{ f.cliente }}</td>
                  <td class="fw-bold small">{{ f.total }}</td>
                  <td>
                    <span class="estado-badge" [ngClass]="f.estadoClass">{{ f.estado }}</span>
                  </td>
                  <td class="text-end text-muted small">{{ f.fecha }}</td>
                </tr>
              </tbody>
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
                <span class="small fw-bold text-muted" style="font-size: 0.65rem;">CONSUMO DE PLAN</span>
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


            <!-- Accesos Rápidos originales -->
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
                </a>
                <a routerLink="/usuario/clientes" class="quick-link">
                  <div class="ql-icon" style="color:#0ea5e9; background:rgba(14,165,233,.1)">
                    <i class="bi bi-person-plus-fill"></i>
                  </div>
                  <span>Nuevo Cliente</span>
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
              <span><i class="bi bi-graph-up-arrow me-2"></i>Productos más vendidos</span>
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



      <!-- ── FILA 3: Alertas del sistema ── -->
      <div class="row g-3">
        <div class="col-12">
          <div class="alert-bar">
            <div class="alert-bar-icon warning">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div class="alert-bar-body">
              <strong>Módulo en construcción</strong> — Los datos de este dashboard estarán disponibles próximamente. Las estadísticas son de muestra.
            </div>
            <a routerLink="/usuario/facturacion" class="alert-bar-action">Ir a Facturación</a>
          </div>
        </div>
      </div>

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

    /* Alert bar */
    .alert-bar {
      background: white;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .alert-bar-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .alert-bar-icon.warning { background: rgba(245,158,11,.1); color: #f59e0b; }
    .alert-bar-body { flex: 1; font-size: 0.875rem; color: #475569; }
    .alert-bar-action {
      font-size: 0.8rem;
      font-weight: 700;
      color: #6366f1;
      text-decoration: none;
      white-space: nowrap;
    }
  `]
})
export class DashboardComponent implements OnInit {
  overview?: DashboardOverview;
  loading = true;

  // Datos mock para facturas (hasta conectar facturas list)
  mockFacturas = [
    { numero: '001-001-000000001', cliente: 'Juan Carlos Pérez', total: '$145.00', estado: 'AUTORIZADA', estadoClass: 'estado-badge badge-autorizada', fecha: 'Hoy' },
    { numero: '001-001-000000002', cliente: 'Empresa Demo S.A.', total: '$320.50', estado: 'AUTORIZADA', estadoClass: 'estado-badge badge-autorizada', fecha: 'Hoy' },
    { numero: '001-001-000000003', cliente: 'María López', total: '$89.00', estado: 'BORRADOR', estadoClass: 'estado-badge badge-borrador', fecha: 'Ayer' },
  ];

  constructor(
    private uiService: UiService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.uiService.setPageHeader('Dashboard', 'Resumen general de tu actividad');
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.dashboardService.getOverview('month').subscribe({
      next: (data) => {
        this.overview = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        this.loading = false;
      }
    });
  }


}
