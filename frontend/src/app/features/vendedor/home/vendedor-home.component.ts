import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendedorHomeService, VendedorHomeData } from './services/vendedor-home.service';
import { UiService } from '../../../shared/services/ui.service';
import { SharedModule } from '../../../shared/shared.module';
import { finalize } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-vendedor-home',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  template: `
    <div class="vendedor-home-container animate__animated animate__fadeIn">
        <!-- COLUMNA PRINCIPAL (Acciones y Alertas) -->
        <div class="col-main">
          <!-- ACCIONES RÁPIDAS -->
          <div class="quick-actions-section mb-4">
            <h3 class="section-subtitle">Acciones Frecuentes</h3>
            <div class="actions-grid">
              <!-- Botón 1: Crear Empresa -->
              <div class="action-card" routerLink="/vendedor/empresas">
                <div class="action-icon bg-indigo-100 text-indigo-600">
                  <i class="bi bi-building-add"></i>
                </div>
                <div class="action-info">
                  <h4>Registrar Empresa</h4>
                  <p>Inscribir un nuevo cliente</p>
                </div>
                <div class="action-arrow"><i class="bi bi-chevron-right"></i></div>
              </div>

              <!-- Botón 2: Ver Reportes -->
              <div class="action-card" routerLink="/vendedor/reportes">
                <div class="action-icon bg-emerald-100 text-emerald-600">
                  <i class="bi bi-file-earmark-bar-graph"></i>
                </div>
                <div class="action-info">
                  <h4>REPORTES</h4>
                  <p>Descargar reportes y métricas</p>
                </div>
                <div class="action-arrow"><i class="bi bi-chevron-right"></i></div>
              </div>
            </div>
          </div>

          <!-- TABLERO DE URGENCIAS -->
          <div class="alerts-section">
            <div class="d-flex align-items-center mb-3">
              <h3 class="section-subtitle m-0 me-2">Tablero de Urgencias</h3>
              <span class="badge bg-danger rounded-pill" *ngIf="alertasRenovacion.length">{{ alertsCount }}</span>
            </div>
            
            <div class="alerts-list">
              <div class="alert-item" *ngFor="let alerta of data?.alertas" [ngClass]="{'alert-danger': alerta.tipo === 'RENOVACION_PROXIMA', 'alert-success': alerta.tipo === 'COMISION_APROBADA'}">
                <div class="alert-icon">
                  <i *ngIf="alerta.tipo === 'RENOVACION_PROXIMA'" class="bi bi-exclamation-triangle-fill text-danger"></i>
                  <i *ngIf="alerta.tipo === 'COMISION_APROBADA'" class="bi bi-check-circle-fill text-success"></i>
                </div>
                <div class="alert-body">
                  <h5 class="alert-title">{{ alerta.titulo }}</h5>
                  <p class="alert-desc">{{ alerta.descripcion }}</p>
                  <span class="alert-date"><i class="bi bi-clock me-1"></i>{{ alerta.fecha }}</span>
                </div>
                <!-- <div class="alert-action" *ngIf="alerta.accion_url">
                   <button class="btn btn-sm btn-outline-danger">Atender</button>
                </div> -->
              </div>

              <!-- Empty State Alertas -->
              <div class="empty-state" *ngIf="!data?.alertas?.length && !isLoading">
                <i class="bi bi-shield-check text-success" style="font-size: 2.5rem;"></i>
                <h5>Todo bajo control</h5>
                <p>No tienes tareas urgentes pendientes.</p>
              </div>

              <!-- Loading State -->
              <div class="d-flex justify-content-center py-4" *ngIf="isLoading">
                 <div class="spinner-border text-primary" role="status"></div>
              </div>
          </div>
        </div>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .text-gray-900 { color: #111827; }
    .text-gray-500 { color: #6b7280; }
    .page-title { font-weight: 800; font-size: 1.5rem; }
    .section-subtitle { font-weight: 700; font-size: 1.15rem; color: #1e293b; }
    
    .col-main {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }

    /* ACTIONS GRID */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
    .action-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
    }
    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      border-color: #cbd5e1;
    }
    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-right: 1.25rem;
      flex-shrink: 0;
    }
    .action-info h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
    }
    .action-info p {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
    }
    .action-arrow {
      margin-left: auto;
      color: #cbd5e1;
      font-size: 1.2rem;
    }
    
    /* ALERTS SECTION */
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .alert-item {
      display: flex;
      align-items: flex-start;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: white;
    }
    .alert-item.alert-danger { border-left: 4px solid #ef4444; background: #fef2f2; }
    .alert-item.alert-success { border-left: 4px solid #10b981; background: #ecfdf5; }
    
    .alert-icon {
      font-size: 1.5rem;
      margin-right: 1rem;
      margin-top: 2px;
    }
    .alert-body { flex: 1; }
    .alert-title {
      margin: 0 0 0.35rem 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #111827;
    }
    .alert-desc {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      color: #4b5563;
    }
    .alert-date {
      font-size: 0.8rem;
      color: #6b7280;
      font-weight: 500;
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background: white;
      border-radius: 12px;
      border: 1px dashed #cbd5e1;
    }
    .empty-state h5 { margin-top: 1rem; font-weight: 700; color: #334155; }
    .empty-state p {  color: #64748b; }
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
    console.log('[VendedorHomeComponent] ngOnInit iniciado');
    this.cargarDatos();
  }

  cargarDatos() {
    console.log('[VendedorHomeComponent] cargarDatos() llamado. isLoading a true.');
    this.isLoading = true;
    this.homeService.getHomeData()
      .pipe(finalize(() => {
        console.log('[VendedorHomeComponent] observable de getHomeData finalizado. isLoading a false.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          console.log('[VendedorHomeComponent] Datos cargados exitosamente (next):', res);
          this.data = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[VendedorHomeComponent] Error al cargar los datos:', err);
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
