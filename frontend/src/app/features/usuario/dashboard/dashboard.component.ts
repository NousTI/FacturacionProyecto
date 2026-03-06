import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { UiService } from '../../../shared/services/ui.service';

@Component({
  selector: 'app-usuario-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent],
  template: `
    <div class="dash-wrap">

      <!-- ── FILA 1: KPIs ── -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Facturas del Mes"
            value="--"
            icon="bi-receipt"
            iconBg="rgba(99,102,241,.1)"
            iconColor="#6366f1">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Monto Autorizado"
            value="$--"
            icon="bi-check-circle"
            iconBg="rgba(16,185,129,.1)"
            iconColor="#10b981">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Pendiente de Cobro"
            value="$--"
            icon="bi-hourglass-split"
            iconBg="rgba(245,158,11,.1)"
            iconColor="#f59e0b">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Total Clientes"
            value="--"
            icon="bi-people"
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

        <!-- Accesos Rápidos -->
        <div class="col-lg-4">
          <div class="panel h-100">
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
              <a routerLink="/usuario/reportes" class="quick-link">
                <div class="ql-icon" style="color:#f59e0b; background:rgba(245,158,11,.1)">
                  <i class="bi bi-bar-chart-fill"></i>
                </div>
                <span>Reportes</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
              <a routerLink="/usuario/certificado-sri" class="quick-link">
                <div class="ql-icon" style="color:#10b981; background:rgba(16,185,129,.1)">
                  <i class="bi bi-shield-check-fill"></i>
                </div>
                <span>Certificado SRI</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
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

  // Datos mock para previsualizar el layout
  mockFacturas = [
    { numero: '001-001-000000001', cliente: 'Juan Carlos Pérez', total: '$145.00', estado: 'AUTORIZADA', estadoClass: 'estado-badge badge-autorizada', fecha: 'Hoy' },
    { numero: '001-001-000000002', cliente: 'Empresa Demo S.A.', total: '$320.50', estado: 'AUTORIZADA', estadoClass: 'estado-badge badge-autorizada', fecha: 'Hoy' },
    { numero: '001-001-000000003', cliente: 'María López', total: '$89.00', estado: 'BORRADOR', estadoClass: 'estado-badge badge-borrador', fecha: 'Ayer' },
    { numero: '001-001-000000004', cliente: 'Comercial XYZ', total: '$560.00', estado: 'EN PROCESO', estadoClass: 'estado-badge badge-proceso', fecha: 'Ayer' },
    { numero: '001-001-000000005', cliente: 'Ana Martínez', total: '$210.00', estado: 'ANULADA', estadoClass: 'estado-badge badge-anulada', fecha: '04/03' },
  ];

  constructor(private uiService: UiService) {}

  ngOnInit() {
    this.uiService.setPageHeader('Dashboard', 'Resumen general de tu actividad');
  }
}
