import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendedorHomeService, VendedorHomeData } from './services/vendedor-home.service';
import { UiService } from '../../../shared/services/ui.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-vendedor-home',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, ToastComponent],
  template: `
    <div class="dash-wrap">

      <!-- ── FILA 1: KPIs mock ── -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Empresas Asignadas"
            value="--"
            icon="bi-building"
            iconBg="rgba(99,102,241,.1)"
            iconColor="#6366f1">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Comisiones Pendientes"
            value="$--"
            icon="bi-percent"
            iconBg="rgba(245,158,11,.1)"
            iconColor="#f59e0b">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Ingresos Generados"
            value="$--"
            icon="bi-wallet2"
            iconBg="rgba(16,185,129,.1)"
            iconColor="#10b981">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Renovaciones Próximas"
            value="{{ alertasRenovacion.length || '--' }}"
            icon="bi-clock-history"
            iconBg="rgba(239,68,68,.1)"
            iconColor="#ef4444">
          </app-stat-card>
        </div>
      </div>

      <!-- ── FILA 2: Urgencias + Acciones rápidas ── -->
      <div class="row g-3 mb-4">

        <!-- Tablero de Urgencias -->
        <div class="col-lg-8">
          <div class="panel">
            <div class="panel-header">
              <span>
                <i class="bi bi-exclamation-triangle me-2"></i>
                Tablero de Urgencias
              </span>
              <span class="badge bg-danger rounded-pill" *ngIf="alertasRenovacion.length">
                {{ alertasRenovacion.length }}
              </span>
            </div>

            <!-- Loading -->
            <div class="text-center py-5" *ngIf="isLoading">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="text-muted small mt-2">Cargando alertas...</p>
            </div>

            <!-- Lista de alertas -->
            <div class="alerts-list" *ngIf="!isLoading && data?.alertas?.length">
              <div class="alert-row"
                   *ngFor="let alerta of data?.alertas"
                   [ngClass]="{
                     'border-danger-left': alerta.tipo === 'RENOVACION_PROXIMA',
                     'border-success-left': alerta.tipo === 'COMISION_APROBADA'
                   }">
                <div class="alert-icon-box">
                  <i *ngIf="alerta.tipo === 'RENOVACION_PROXIMA'"
                     class="bi bi-exclamation-triangle-fill"
                     style="color:#ef4444"></i>
                  <i *ngIf="alerta.tipo === 'COMISION_APROBADA'"
                     class="bi bi-check-circle-fill"
                     style="color:#10b981"></i>
                  <i *ngIf="alerta.tipo !== 'RENOVACION_PROXIMA' && alerta.tipo !== 'COMISION_APROBADA'"
                     class="bi bi-info-circle-fill"
                     style="color:#6366f1"></i>
                </div>
                <div class="alert-body">
                  <span class="alert-title">{{ alerta.titulo }}</span>
                  <span class="alert-desc">{{ alerta.descripcion }}</span>
                  <span class="alert-date"><i class="bi bi-clock me-1"></i>{{ alerta.fecha }}</span>
                </div>
                <a *ngIf="alerta.accion_url"
                   [routerLink]="alerta.accion_url"
                   class="btn-atender">
                  Atender
                </a>
              </div>
            </div>

            <!-- Empty state -->
            <div class="empty-state" *ngIf="!isLoading && !data?.alertas?.length">
              <i class="bi bi-shield-check" style="font-size:2.5rem; color:#10b981"></i>
              <h5>Todo bajo control</h5>
              <p>No tienes tareas urgentes pendientes.</p>
            </div>
          </div>
        </div>

        <!-- Acciones Rápidas -->
        <div class="col-lg-4">
          <div class="panel h-100">
            <div class="panel-header">
              <span><i class="bi bi-lightning-charge me-2"></i>Acciones Rápidas</span>
            </div>
            <div class="quick-links">
              <a routerLink="/vendedor/empresas" class="quick-link">
                <div class="ql-icon" style="color:#6366f1; background:rgba(99,102,241,.1)">
                  <i class="bi bi-building-add"></i>
                </div>
                <span>Registrar Empresa</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
              <a routerLink="/vendedor/suscripciones" class="quick-link">
                <div class="ql-icon" style="color:#f59e0b; background:rgba(245,158,11,.1)">
                  <i class="bi bi-credit-card"></i>
                </div>
                <span>Suscripciones</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
              <a routerLink="/vendedor/comisiones" class="quick-link">
                <div class="ql-icon" style="color:#10b981; background:rgba(16,185,129,.1)">
                  <i class="bi bi-percent"></i>
                </div>
                <span>Mis Comisiones</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
              <a routerLink="/vendedor/clientes" class="quick-link">
                <div class="ql-icon" style="color:#0ea5e9; background:rgba(14,165,233,.1)">
                  <i class="bi bi-people"></i>
                </div>
                <span>Clientes</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
              <a routerLink="/vendedor/reportes" class="quick-link">
                <div class="ql-icon" style="color:#ec4899; background:rgba(236,72,153,.1)">
                  <i class="bi bi-file-earmark-bar-graph"></i>
                </div>
                <span>Reportes</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- ── FILA 3: Resumen de empresas asignadas ── -->
      <div class="row g-3">
        <div class="col-12">
          <div class="panel">
            <div class="panel-header">
              <span><i class="bi bi-building me-2"></i>Empresas Asignadas</span>
              <a routerLink="/vendedor/empresas" class="panel-header-link">Ver todas</a>
            </div>
            <table class="table table-sm table-hover mb-0">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th class="text-end">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                <!-- Mock data — reemplazar con datos reales al conectar backend -->
                <tr>
                  <td class="fw-bold small">Empresa Demo 1</td>
                  <td class="small text-muted">Plan Pro</td>
                  <td><span class="estado-badge badge-activa">ACTIVA</span></td>
                  <td class="text-end text-muted small">31/03/2026</td>
                </tr>
                <tr>
                  <td class="fw-bold small">Empresa Demo 2</td>
                  <td class="small text-muted">Plan Básico</td>
                  <td><span class="estado-badge badge-vencida">VENCIDA</span></td>
                  <td class="text-end text-danger small">15/02/2026</td>
                </tr>
                <tr>
                  <td class="fw-bold small">Empresa Demo 3</td>
                  <td class="small text-muted">Plan Pro</td>
                  <td><span class="estado-badge badge-activa">ACTIVA</span></td>
                  <td class="text-end text-muted small">10/04/2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <app-toast></app-toast>
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

    /* Alertas */
    .alerts-list { display: flex; flex-direction: column; }
    .alert-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f8fafc;
    }
    .alert-row:last-child { border-bottom: none; }
    .border-danger-left { border-left: 3px solid #ef4444; }
    .border-success-left { border-left: 3px solid #10b981; }
    .alert-icon-box { font-size: 1.25rem; flex-shrink: 0; width: 24px; text-align: center; }
    .alert-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .alert-title { font-size: 0.875rem; font-weight: 700; color: #1e293b; }
    .alert-desc { font-size: 0.8rem; color: #64748b; }
    .alert-date { font-size: 0.75rem; color: #94a3b8; }
    .btn-atender {
      font-size: 0.75rem;
      font-weight: 700;
      color: #6366f1;
      text-decoration: none;
      border: 1px solid #e0e7ff;
      padding: 4px 12px;
      border-radius: 8px;
      white-space: nowrap;
    }
    .btn-atender:hover { background: #eef2ff; }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }
    .empty-state h5 { margin-top: 1rem; font-weight: 700; color: #334155; }
    .empty-state p { color: #64748b; font-size: 0.875rem; margin: 0; }

    /* Quick links */
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
    .table tbody td { padding: 0.75rem 1rem; vertical-align: middle; font-size: 0.875rem; }
    .table-hover tbody tr:hover td { background: #f8fafc; }

    /* Estado badges */
    .estado-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .badge-activa  { background: #ecfdf5; color: #10b981; }
    .badge-vencida { background: #fef2f2; color: #ef4444; }
  `]
})
export class VendedorHomeComponent implements OnInit {
  data: VendedorHomeData | null = null;
  isLoading = false;

  constructor(
    private homeService: VendedorHomeService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading = true;
    this.homeService.getHomeData()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.data = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al cargar panel de inicio');
          this.cdr.detectChanges();
        }
      });
  }

  get alertasRenovacion() {
    return this.data?.alertas?.filter(a => a.tipo === 'RENOVACION_PROXIMA') || [];
  }

  get alertsCount() {
    return this.alertasRenovacion.length;
  }
}
